import { NextResponse } from 'next/server';
import { getAdminAuth, isFirebaseAdminConfigured, getInitError } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const configured = await isFirebaseAdminConfigured();
    const adminAuth = configured ? await getAdminAuth() : null;

    return NextResponse.json({
      firebaseAdminConfigured: configured,
      adminAuthAvailable: !!adminAuth,
      hasServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      serviceAccountKeyLength: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length || 0,
      serviceAccountKeyStart: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.substring(0, 30) || 'empty',
      serviceAccountKeyEnd: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.slice(-15) || 'empty',
      initError: getInitError(),
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'not set',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'not set',
    });
  } catch (err: any) {
    return NextResponse.json({
      error: true,
      message: err.message,
      stack: err.stack?.split('\n').slice(0, 5),
    }, { status: 500 });
  }
}
