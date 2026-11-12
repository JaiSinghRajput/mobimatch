import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import {
  CompleteProfileRequestSchema,
  UpdateProfileRequestSchema,
} from '@mobimatch/api-contracts';
import { getDb } from '../../db';
import { users } from '../../db/schema';
import {
  completeUserProfile,
  updateUserProfile,
  deleteUserAccount,
  isEmailInAdminAllowlist,
} from '../auth/service';

export const userRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Middleware to authenticate Bearer token
  const authenticate = async (req: any, reply: any) => {
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
          message: 'Account is deactivated or deleted',
          requestId: req.id,
        },
      });
    }
  };

  // GET /v1/users/me
  server.get('/v1/users/me', { preHandler: authenticate }, async (req, reply) => {
    const db = getDb();
    const userList = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.userId))
      .limit(1);

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
      updatedAt: user.updatedAt.toISOString(),
    });
  });

  // POST /v1/users/complete-profile
  server.post(
    '/v1/users/complete-profile',
    { preHandler: authenticate },
    async (req, reply) => {
      const parseResult = CompleteProfileRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_PROFILE_DATA',
            message: parseResult.error.errors.map((e) => e.message).join(', '),
            requestId: req.id,
          },
        });
      }

      const updated = await completeUserProfile(req.user.userId, parseResult.data);
      const isAdmin = await isEmailInAdminAllowlist(updated.email);

      return reply.status(200).send({
        id: updated.id,
        email: updated.email,
        name: updated.name,
        phone: updated.phone,
        shopName: updated.shopName,
        city: updated.city,
        status: updated.status,
        isAdmin,
        isProfileComplete: true,
        updatedAt: updated.updatedAt.toISOString(),
      });
    }
  );

  // PATCH /v1/users/me
  server.patch('/v1/users/me', { preHandler: authenticate }, async (req, reply) => {
    const parseResult = UpdateProfileRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_UPDATE_DATA',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
          requestId: req.id,
        },
      });
    }

    const updated = await updateUserProfile(req.user.userId, parseResult.data);
    const isAdmin = await isEmailInAdminAllowlist(updated.email);

    return reply.status(200).send({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      phone: updated.phone,
      shopName: updated.shopName,
      city: updated.city,
      status: updated.status,
      isAdmin,
      isProfileComplete: Boolean(updated.phone && updated.shopName && updated.city),
      updatedAt: updated.updatedAt.toISOString(),
    });
  });

  // DELETE /v1/users/me
  server.delete('/v1/users/me', { preHandler: authenticate }, async (req, reply) => {
    await deleteUserAccount(req.user.userId);
    return reply.status(200).send({
      success: true,
      message: 'Account and associated personal sessions have been successfully deleted',
    });
  });
};
