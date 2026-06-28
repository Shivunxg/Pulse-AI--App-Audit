import { NextRequest, NextResponse } from 'next/server';
import { loginUser, verifyFirebaseToken } from '@/lib/auth';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { email, password, idToken } = await request.json();

    // Firebase Google sign-in: client sends idToken
    if (idToken) {
      const configured = await isFirebaseAdminConfigured();
      if (configured) {
        try {
          const { user, token } = await verifyFirebaseToken(idToken);
          return NextResponse.json({ user, token });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Firebase auth failed';
          return NextResponse.json({ error: msg }, { status: 401 });
        }
      }
    }

    // Email/password login
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    try {
      const { user, token } = await loginUser(email, password);
      return NextResponse.json({ user, token });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      if (msg === '__USE_FIREBASE_CLIENT__') {
        return NextResponse.json({ error: '__USE_FIREBASE_CLIENT__' }, { status: 400 });
      }
      return NextResponse.json({ error: msg }, { status: 401 });
    }
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}