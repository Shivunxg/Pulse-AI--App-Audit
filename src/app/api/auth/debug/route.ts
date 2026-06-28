import { NextResponse } from 'next/server';

export async function GET() {
  const results: Record<string, string> = {};

  // 1. Check env vars exist
  results['FIREBASE_SERVICE_ACCOUNT_KEY'] = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? `Set (${process.env.FIREBASE_SERVICE_ACCOUNT_KEY.length} chars)` : 'MISSING';

  results['DATABASE_URL'] = process.env.DATABASE_URL
    ? `Set (${process.env.DATABASE_URL.substring(0, 30)}...)` : 'MISSING';

  results['NEXT_PUBLIC_FIREBASE_PROJECT_ID'] = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'MISSING';

  // 2. Test Firebase Admin
  try {
    const { getAdminAuth, isFirebaseAdminConfigured } = await import('@/lib/firebase/admin');
    const configured = await isFirebaseAdminConfigured();
    results['Firebase Admin'] = configured ? 'Initialized OK' : 'NOT configured (check SERVICE_ACCOUNT_KEY)';
  } catch (err: any) {
    results['Firebase Admin'] = `Error: ${err.message}`;
  }

  // 3. Test Database
  try {
    const { db } = await import('@/lib/db');
    await db.$connect();
    const userCount = await db.user.count();
    results['Database'] = `Connected OK (${userCount} users)`;
    await db.$disconnect();
  } catch (err: any) {
    results['Database'] = `Error: ${err.message?.substring(0, 100)}`;
  }

  return NextResponse.json(results);
}