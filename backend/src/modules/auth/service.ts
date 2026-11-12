import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { getDb } from '../../db';
import { users, adminAllowlist, sessions } from '../../db/schema';
import { config } from '../../config';
import {
  CompleteProfileRequest,
  UpdateProfileRequest,
  UserStatus,
} from '@mobimatch/api-contracts';

const googleClient = new OAuth2Client();

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateSecureToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

export interface GoogleVerifiedIdentity {
  sub: string;
  email: string;
  name: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleVerifiedIdentity> {
  // Mock / Dev verification mode for test or local development without real Google credentials
  if (config.devMockAuth) {
    if (idToken.startsWith('mock-')) {
      const parts = idToken.split(':');
      const email = (parts[1] || 'technician@example.com').toLowerCase();
      const sub = parts[2] || 'google-mock-sub-' + hashToken(email).slice(0, 16);
      const name = parts[3] || 'MobiMatch User';
      return { sub, email, name };
    }
  }

  // Official Google ID token verification
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.googleClientIds.length > 0 ? config.googleClientIds : undefined,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      throw new Error('Invalid token payload from Google');
    }

    return {
      sub: payload.sub,
      email: payload.email.toLowerCase().trim(),
      name: payload.name || payload.email.split('@')[0],
    };
  } catch (err) {
    throw new Error(`Google token verification failed: ${(err as Error).message}`);
  }
}

export async function isEmailInAdminAllowlist(email: string): Promise<boolean> {
  const db = getDb();
  const normalized = email.toLowerCase().trim();
  const res = await db
    .select({ id: adminAllowlist.id })
    .from(adminAllowlist)
    .where(eq(adminAllowlist.emailNormalized, normalized))
    .limit(1);

  return res.length > 0;
}

export async function findOrCreateUserByGoogle(identity: GoogleVerifiedIdentity) {
  const db = getDb();

  // Stable Google Sub lookup
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.googleSub, identity.sub))
    .limit(1);

  if (existingUsers.length > 0) {
    return existingUsers[0];
  }

  // Create initial user record with mandatory profile pending
  const now = new Date();
  const [createdUser] = await db
    .insert(users)
    .values({
      googleSub: identity.sub,
      email: identity.email,
      name: identity.name,
      phone: '', // Pending completion
      shopName: '', // Pending completion
      city: '', // Pending completion
      status: 'active',
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return createdUser;
}

export async function createSession(userId: string, deviceLabel?: string) {
  const db = getDb();
  const rawRefreshToken = generateSecureToken();
  const hashed = hashToken(rawRefreshToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.jwtRefreshExpiresIn * 1000);

  const [session] = await db
    .insert(sessions)
    .values({
      userId,
      refreshTokenHash: hashed,
      deviceLabel: deviceLabel || 'Mobile App',
      createdAt: now,
      lastUsedAt: now,
      expiresAt,
    })
    .returning();

  return {
    sessionId: session.id,
    rawRefreshToken,
    expiresAt,
  };
}

export async function rotateSession(rawRefreshToken: string) {
  const db = getDb();
  const hashed = hashToken(rawRefreshToken);
  const now = new Date();

  // Look up active session
  const activeSessions = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.refreshTokenHash, hashed),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now)
      )
    )
    .limit(1);

  if (activeSessions.length === 0) {
    return null;
  }

  const session = activeSessions[0];

  // Look up user
  const userList = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (userList.length === 0) {
    return null;
  }
  const user = userList[0];

  if (user.status !== 'active') {
    // Revoke session if user is not active
    await db
      .update(sessions)
      .set({ revokedAt: now })
      .where(eq(sessions.id, session.id));
    return null;
  }

  // Rotate token
  const newRawRefreshToken = generateSecureToken();
  const newHashed = hashToken(newRawRefreshToken);
  const newExpiresAt = new Date(now.getTime() + config.jwtRefreshExpiresIn * 1000);

  await db
    .update(sessions)
    .set({
      refreshTokenHash: newHashed,
      lastUsedAt: now,
      expiresAt: newExpiresAt,
    })
    .where(eq(sessions.id, session.id));

  const isAdmin = await isEmailInAdminAllowlist(user.email);

  return {
    user,
    isAdmin,
    newRawRefreshToken,
    expiresIn: config.jwtAccessExpiresIn,
  };
}

export async function revokeSessionByToken(rawRefreshToken: string) {
  const db = getDb();
  const hashed = hashToken(rawRefreshToken);
  const now = new Date();

  await db
    .update(sessions)
    .set({ revokedAt: now })
    .where(eq(sessions.refreshTokenHash, hashed));
}

export async function revokeAllUserSessions(userId: string) {
  const db = getDb();
  const now = new Date();

  await db.update(sessions).set({ revokedAt: now }).where(eq(sessions.userId, userId));
}

export async function completeUserProfile(
  userId: string,
  data: CompleteProfileRequest
) {
  const db = getDb();
  const now = new Date();

  const [updatedUser] = await db
    .update(users)
    .set({
      phone: data.phone,
      shopName: data.shopName,
      city: data.city,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      updatedAt: now,
    })
    .where(eq(users.id, userId))
    .returning();

  return updatedUser;
}

export async function updateUserProfile(userId: string, data: UpdateProfileRequest) {
  const db = getDb();
  const now = new Date();
  const updateData: Record<string, unknown> = { updatedAt: now };

  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.shopName !== undefined) updateData.shopName = data.shopName;
  if (data.city !== undefined) updateData.city = data.city;

  const [updatedUser] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .returning();

  return updatedUser;
}

export async function deleteUserAccount(userId: string) {
  const db = getDb();
  const now = new Date();

  // Revoke all sessions immediately
  await revokeAllUserSessions(userId);

  // Anonymize personal info and set deleted status
  const anonymizedEmail = `deleted_${userId.slice(0, 8)}@deleted.mobimatch.local`;
  const [deletedUser] = await db
    .update(users)
    .set({
      email: anonymizedEmail,
      name: 'Deleted User',
      phone: '',
      shopName: '',
      city: '',
      status: 'deleted',
      deletedAt: now,
      updatedAt: now,
    })
    .where(eq(users.id, userId))
    .returning();

  return deletedUser;
}

