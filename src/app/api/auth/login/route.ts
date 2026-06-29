import { NextRequest, NextResponse } from 'next/server';
import { loginUser, verifyFirebaseToken } from '@/lib/auth';
import { isFirebaseConfigured } from '@/lib/firebase-token-verify';

export async function POST(request: NextRequest) {
  try {
    const { email, password, idToken } = await request.json();

    // Firebase Google/Email sign-in: client sends idToken
    if (idToken && isFirebaseConfigured()) {
      try {
        const { user, token } = await verifyFirebaseToken(idToken);
        return NextResponse.json({ user, token });
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
      return NextResponse.json({ user, token });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      return NextResponse.json({ error: msg }, { status: 401 });
    }
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}