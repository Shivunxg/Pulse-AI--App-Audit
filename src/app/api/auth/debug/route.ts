import { NextResponse } from 'next/server';
import { verifyFirebaseToken, isFirebaseConfigured } from '@/lib/firebase-token-verify';

export async function GET() {
  try {
    return NextResponse.json({
      firebaseConfigured: isFirebaseConfigured(),
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'not set',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'not set',
      hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      approach: 'jose JWT verification (no firebase-admin)',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}