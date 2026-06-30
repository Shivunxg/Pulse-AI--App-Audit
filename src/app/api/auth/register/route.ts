import { NextRequest, NextResponse } from 'next/server';
import { registerUser, logoutUser } from '@/lib/auth';
import { isFirebaseConfigured } from '@/lib/firebase-token-verify';
import { buildSessionCookie } from '@/lib/session-cookie';
import { buildClearSessionCookie } from '@/lib/session-cookie';

export async function POST(request: NextRequest) {
  try {
    const { email, name, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // If Firebase is configured, email/password signup is handled client-side
    if (isFirebaseConfigured()) {
      return NextResponse.json({ error: '__USE_FIREBASE_CLIENT__' }, { status: 400 });
    }

    try {
      const { user, token } = await registerUser(email, name, password);
      const res = NextResponse.json({ user, token });
      res.headers.set('Set-Cookie', buildSessionCookie(token));
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      const status = msg.includes('already exists') ? 409 : 400;
      return NextResponse.json({ error: msg }, { status });
    }
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token) await logoutUser(token);
    const res = NextResponse.json({ success: true });
    res.headers.set('Set-Cookie', buildClearSessionCookie());
    return res;
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}