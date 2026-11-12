import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import {
  GoogleAuthRequestSchema,
  RefreshTokenRequestSchema,
  TokenResponse,
} from '@mobimatch/api-contracts';
import {
  verifyGoogleIdToken,
  isEmailInAdminAllowlist,
  findOrCreateUserByGoogle,
  createSession,
  rotateSession,
  revokeSessionByToken,
  revokeAllUserSessions,
} from './service';
import { config } from '../../config';
import { getDb } from '../../db';
import { users } from '../../db/schema';

export const authRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // POST /v1/auth/google
  server.post('/v1/auth/google', async (req, reply) => {
    const parseResult = GoogleAuthRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
          requestId: req.id,
        },
      });
    }

    const { idToken, clientApp } = parseResult.data;

    let identity;
    try {
      identity = await verifyGoogleIdToken(idToken);
    } catch (err) {
      return reply.status(401).send({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: (err as Error).message || 'Invalid Google identity token',
          requestId: req.id,
        },
      });
    }

    const isAdmin = await isEmailInAdminAllowlist(identity.email);

    // If client is Admin App, enforce immediate allowlist membership check
    if (clientApp === 'admin' && !isAdmin) {
      return reply.status(403).send({
        error: {
          code: 'ADMIN_ACCESS_DENIED',
          message:
            'This Google account is not on the administrator allowlist.',
          requestId: req.id,
        },
      });
    }

    const user = await findOrCreateUserByGoogle(identity);

    // Check user account status
    if (user.status === 'deactivated') {
      return reply.status(403).send({
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Your account has been deactivated. Please contact support.',
          requestId: req.id,
        },
      });
    }

    if (user.status === 'deleted') {
      return reply.status(403).send({
        error: {
          code: 'ACCOUNT_DELETED',
          message: 'This account has been deleted.',
          requestId: req.id,
        },
      });
    }

    // Create session and rotating refresh token
    const session = await createSession(
      user.id,
      clientApp === 'admin' ? 'MobiMatch Admin' : 'MobiMatch User App'
    );

    // Issue short-lived access token
    const accessToken = server.jwt.sign(
      {
        userId: user.id,
        email: user.email,
        isAdmin,
      },
      { expiresIn: config.jwtAccessExpiresIn }
    );

    const isProfileComplete = Boolean(user.phone && user.shopName && user.city);

    const response: TokenResponse = {
      accessToken,
      refreshToken: session.rawRefreshToken,
      expiresIn: config.jwtAccessExpiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone || null,
        shopName: user.shopName || null,
        city: user.city || null,
        status: user.status as 'active' | 'deactivated' | 'deleted',
        isAdmin,
        isProfileComplete,
      },
    };

    return reply.status(200).send(response);
  });

  // POST /v1/auth/refresh
  server.post('/v1/auth/refresh', async (req, reply) => {
    const parseResult = RefreshTokenRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Valid refresh token is required',
          requestId: req.id,
        },
      });
    }

    const rotated = await rotateSession(parseResult.data.refreshToken);
    if (!rotated) {
      return reply.status(401).send({
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Session has expired or was revoked. Please sign in again.',
          requestId: req.id,
        },
      });
    }

    const accessToken = server.jwt.sign(
      {
        userId: rotated.user.id,
        email: rotated.user.email,
        isAdmin: rotated.isAdmin,
      },
      { expiresIn: rotated.expiresIn }
    );

    return reply.status(200).send({
      accessToken,
      refreshToken: rotated.newRawRefreshToken,
      expiresIn: rotated.expiresIn,
    });
  });

  // POST /v1/auth/logout
  server.post('/v1/auth/logout', async (req, reply) => {
    const body = req.body as { refreshToken?: string } | undefined;
    if (body?.refreshToken) {
      await revokeSessionByToken(body.refreshToken);
    }
    return reply.status(200).send({ success: true, message: 'Logged out successfully' });
  });

  // POST /v1/auth/logout-all (Requires Bearer token)
  server.post(
    '/v1/auth/logout-all',
    {
      preHandler: async (req, reply) => {
        try {
          await req.jwtVerify();
        } catch {
          return reply.status(401).send({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
              requestId: req.id,
            },
          });
        }
      },
    },
    async (req, reply) => {
      await revokeAllUserSessions(req.user.userId);
      return reply
        .status(200)
        .send({ success: true, message: 'Logged out from all devices successfully' });
    }
  );

  // GET /v1/auth/me (Requires Bearer token)
  server.get(
    '/v1/auth/me',
    {
      preHandler: async (req, reply) => {
        try {
          await req.jwtVerify();
        } catch {
          return reply.status(401).send({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
              requestId: req.id,
            },
          });
        }
      },
    },
    async (req, reply) => {
      const db = getDb();
      const userList = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user.userId))
        .limit(1);

      if (userList.length === 0 || userList[0].status !== 'active') {
        return reply.status(403).send({
          error: {
            code: 'ACCOUNT_INACTIVE',
            message: 'User account is not active',
            requestId: req.id,
          },
        });
      }

      const user = userList[0];
      const isAdmin = await isEmailInAdminAllowlist(user.email);

      return reply.status(200).send({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        shopName: user.shopName,
        city: user.city,
        status: user.status,
        isAdmin,
        isProfileComplete: Boolean(user.phone && user.shopName && user.city),
        createdAt: user.createdAt.toISOString(),
      });
    }
  );
};
