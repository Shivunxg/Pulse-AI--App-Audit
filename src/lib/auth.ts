import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { db } from './db';
import { verifyFirebaseToken as verifyToken, isFirebaseConfigured } from './firebase-token-verify';

const scryptAsync = promisify(scrypt);

// --- Types ---

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

// --- Local password helpers (fallback when Firebase is not configured) ---

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(':');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(derivedKey, Buffer.from(key, 'hex'));
}

// --- Local session helpers (fallback) ---

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { token, userId, expiresAt } });
  return token;
}

async function validateLocalSession(token: string) {
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } });
    return null;
  }
  return session.user;
}

export async function deleteSession(token: string): Promise<void> {
  if (token) await db.session.deleteMany({ where: { token } });
}

export function getTokenFromHeader(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

// --- Core auth: getUserFromRequest ---

export async function getUserFromRequest(request: Request): Promise<AuthUser | null> {
  const token = getTokenFromHeader(request);
  if (!token) return null;

  // Firebase mode: verify ID token
  if (isFirebaseConfigured()) {
    try {
      const decoded = await verifyToken(token);
      await ensureLocalUser(decoded.uid, decoded.email!, decoded.name || null);
      return {
        id: decoded.uid,
        email: decoded.email || '',
        name: decoded.name || null,
      };
    } catch (err) {
      return null;
    }
  }

  // Fallback: local session token
  const localUser = await validateLocalSession(token);
  if (localUser) {
    return { id: localUser.id, email: localUser.email, name: localUser.name };
  }
  return null;
}

// --- Register ---

export async function registerUser(email: string, password: string, name?: string): Promise<{ user: AuthUser; token: string }> {
  // Local fallback
  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) throw new Error('An account with this email already exists');

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: { email: email.toLowerCase(), name: name || email.split('@')[0], passwordHash },
  });
  const token = await createSession(user.id);
  return { user: { id: user.id, email: user.email, name: user.name }, token };
}

// --- Login ---

export async function loginUser(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) throw new Error('Invalid email or password');
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new Error('Invalid email or password');
  const token = await createSession(user.id);
  return { user: { id: user.id, email: user.email, name: user.name }, token };
}

// --- Firebase Google sign-in token exchange ---

export async function verifyFirebaseToken(idToken: string): Promise<{ user: AuthUser; token: string }> {
  const decoded = await verifyToken(idToken);
  await ensureLocalUser(decoded.uid, decoded.email!, decoded.name || null);

  return {
    user: { id: decoded.uid, email: decoded.email || '', name: decoded.name || null },
    token: idToken,
  };
}

// --- Logout ---

export async function logoutUser(token: string): Promise<void> {
  try { await deleteSession(token); } catch { /* might be a Firebase JWT */ }
}

// --- Internal: ensure local user record for DB relations ---

async function ensureLocalUser(id: string, email: string, name: string | null): Promise<void> {
  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) {
    await db.user.create({
      data: { id, email: email.toLowerCase(), name, passwordHash: '__firebase__' },
    });
  } else if (name && existing.name !== name) {
    await db.user.update({ where: { id }, data: { name } });
  }
}