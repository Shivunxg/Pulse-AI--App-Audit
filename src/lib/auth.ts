import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { db } from './db';
import { supabase, isSupabaseConfigured } from './supabase/client';

const scryptAsync = promisify(scrypt);

// --- Local password helpers (fallback when Supabase is not configured) ---

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

export async function validateSession(token: string) {
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

// --- Supabase Auth helpers ---

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

/**
 * Validate a Bearer token.
 * - If Supabase is configured: validate as a Supabase access_token via getUser()
 * - Fallback: validate as a local session token
 */
export async function getUserFromRequest(request: Request): Promise<AuthUser | null> {
  const token = getTokenFromHeader(request);
  if (!token) return null;

  // Try Supabase Auth first
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        // Ensure user exists in our local DB (for data relations)
        await ensureLocalUser(user.id, user.email!, user.user_metadata?.name || user.user_metadata?.full_name || null);
        return {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.user_metadata?.full_name || null,
        };
      }
    } catch (err) {
      console.error('Supabase auth validation error:', err);
    }
    // If Supabase fails, don't fall through to local (prevents mixed auth)
    return null;
  }

  // Fallback: local session
  const localUser = await validateSession(token);
  if (localUser) {
    return { id: localUser.id, email: localUser.email, name: localUser.name };
  }
  return null;
}

/**
 * Register a new user.
 * - If Supabase: signUp via Supabase Auth, then create local user record
 * - Fallback: local scrypt-based registration
 */
export async function registerUser(email: string, password: string, name?: string): Promise<{ user: AuthUser; token: string }> {
  if (isSupabaseConfigured && supabase) {
    // Supabase Auth signup
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: { name: name || email.split('@')[0] },
      },
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        throw new Error('An account with this email already exists');
      }
      throw new Error(error.message);
    }

    const sbUser = data.user;
    if (!sbUser) throw new Error('Registration failed');

    const token = data.session?.access_token || '';

    // Create local user record for data relations
    await ensureLocalUser(sbUser.id, sbUser.email!, name || email.split('@')[0]);

    return {
      user: { id: sbUser.id, email: sbUser.email!, name: name || email.split('@')[0] },
      token,
    };
  }

  // Fallback: local registration
  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) throw new Error('An account with this email already exists');

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: {
      email: email.toLowerCase(),
      name: name || email.split('@')[0],
      passwordHash,
    },
  });

  const token = await createSession(user.id);
  return {
    user: { id: user.id, email: user.email, name: user.name },
    token,
  };
}

/**
 * Login a user.
 * - If Supabase: signInWithPassword, then ensure local user record
 * - Fallback: local scrypt-based login
 */
export async function loginUser(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login') || error.message.includes('Invalid credentials')) {
        throw new Error('Invalid email or password');
      }
      throw new Error(error.message);
    }

    const sbUser = data.user;
    if (!sbUser) throw new Error('Login failed');

    const token = data.session.access_token;

    await ensureLocalUser(sbUser.id, sbUser.email!, sbUser.user_metadata?.name || sbUser.user_metadata?.full_name || null);

    return {
      user: {
        id: sbUser.id,
        email: sbUser.email!,
        name: sbUser.user_metadata?.name || sbUser.user_metadata?.full_name || null,
      },
      token,
    };
  }

  // Fallback: local login
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) throw new Error('Invalid email or password');

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new Error('Invalid email or password');

  const token = await createSession(user.id);
  return { user: { id: user.id, email: user.email, name: user.name }, token };
}

/**
 * Logout.
 * - If Supabase: sign out + delete local session
 * - Fallback: delete local session
 */
export async function logoutUser(token: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch {
      // Continue even if Supabase signout fails
    }
  }

  // Always try to clean up local session too
  try {
    await deleteSession(token);
  } catch {
    // Token might be a Supabase JWT, not in local sessions table
  }
}

// --- Internal helpers ---

/**
 * Ensure a user record exists in the local DB for data relations (projects, audits).
 * This is needed because Supabase Auth manages users in a separate `auth.users` table.
 */
async function ensureLocalUser(id: string, email: string, name: string | null): Promise<void> {
  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) {
    await db.user.create({
      data: {
        id,
        email: email.toLowerCase(),
        name,
        passwordHash: '__supabase__', // Placeholder, actual auth is handled by Supabase
      },
    });
  } else {
    // Update name if it changed
    if (name && existing.name !== name) {
      await db.user.update({ where: { id }, data: { name } });
    }
  }
}