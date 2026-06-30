import { NextRequest, NextResponse } from 'next/server';
import { loginUser, verifyFirebaseToken } from '@/lib/auth';
import { isFirebaseConfigured } from '@/lib/firebase-token-verify';
import { buildSessionCookie } from '@/lib/session-cookie';

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string; idToken?: string } = {};

  // Safe body parse — malformed JSON returns 400, never crashes
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, password, idToken } = body;

  try {
    // Firebase Google/Email sign-in: client sends idToken
    if (idToken && isFirebaseConfigured()) {
      try {
        const { user, token } = await verifyFirebaseToken(idToken);
        const res = NextResponse.json({ user, token });
        res.headers.set('Set-Cookie', buildSessionCookie(token));
        return res;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Firebase auth failed';
        return NextResponse.json({ error: msg }, { status: 401 });
      }
    }

    // Email/password login (local fallback)
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    try {
      const { user, token } = await loginUser(email, password);
      const res = NextResponse.json({ user, token });
      res.headers.set('Set-Cookie', buildSessionCookie(token));
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      return NextResponse.json({ error: msg }, { status: 401 });
    }
  } catch (err) {
    console.error('[/api/auth/login] Unhandled error:', err);
    const msg = err instanceof Error ? err.message : 'Internal server error';
    // Include detail in dev, hide in prod
    const detail = process.env.NODE_ENV === 'development' ? msg : undefined;
    return NextResponse.json({ error: 'Internal server error', ...(detail && { detail }) }, { status: 500 });
  }
}
