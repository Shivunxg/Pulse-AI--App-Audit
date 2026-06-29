import { NextResponse } from 'next/server';
import { getAdminAuth, isFirebaseAdminConfigured } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const configured = await isFirebaseAdminConfigured();
    const adminAuth = configured ? await getAdminAuth() : null;

    return NextResponse.json({
      firebaseAdminConfigured: configured,
      adminAuthAvailable: !!adminAuth,
      hasServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      serviceAccountKeyLength: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length || 0,
      serviceAccountKeyStart: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.substring(0, 20) || 'empty',
      serviceAccountKeyEnd: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.slice(-10) || 'empty',
      hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'not set',
      error: adminAuth ? null : configured ? 'init failed' : 'no service account key',
    });
  } catch (err: any) {
    return NextResponse.json({
      error: true,
      message: err.message,
      stack: err.stack?.split('\n').slice(0, 5),
    }, { status: 500 });
  }
}