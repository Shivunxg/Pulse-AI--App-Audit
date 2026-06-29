// Firebase Admin — fully lazy to avoid module-level crashes
let _adminAuth: any = null;
let _initAttempted = false;
let _initError: string | null = null;

async function tryInit() {
  if (_initAttempted) return;
  _initAttempted = true;
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccount) return;
    const { cert, getApps, getApp, initializeApp } = await import('firebase-admin/app');
    const { getAuth } = await import('firebase-admin/auth');
    const credentials = JSON.parse(serviceAccount);
    const app = getApps().length ? getApp() : initializeApp({ credential: cert(credentials) });
    _adminAuth = getAuth(app);
    console.log('Firebase Admin initialized successfully');
  } catch (err: any) {
    _initError = err?.message || String(err);
    console.error('Firebase Admin init error:', _initError);
  }
}

export async function getAdminAuth() {
  if (!_initAttempted) await tryInit();
  return _adminAuth;
}

export async function isFirebaseAdminConfigured(): Promise<boolean> {
  if (!_initAttempted) await tryInit();
  return !!_adminAuth;
}

export function getInitError(): string | null {
  return _initError;
}