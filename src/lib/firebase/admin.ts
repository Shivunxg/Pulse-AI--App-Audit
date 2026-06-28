import { cert, getApps, getApp, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

export const isFirebaseAdminConfigured = !!serviceAccount;

let adminAuth: ReturnType<typeof getAuth> | null = null;

if (serviceAccount) {
  try {
    const credentials = JSON.parse(serviceAccount);
    const app = getApps().length ? getApp() : initializeApp({ credential: cert(credentials) });
    adminAuth = getAuth(app);
  } catch (err) {
    console.error('Firebase Admin init error:', err);
  }
}

export { adminAuth };