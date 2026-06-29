// Lightweight Firebase ID token verification without firebase-admin
// Verifies JWTs using Google's public JWK set directly via jose

import { createRemoteJWKSet, jwtVerify } from 'jose';

// Correct JWK endpoint for Firebase ID tokens
const FIREBASE_JWKS_URL = new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
);

// Cache the remote JWKS fetcher (jose handles caching internally)
let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!_jwks) {
    _jwks = createRemoteJWKSet(FIREBASE_JWKS_URL);
  }
  return _jwks;
}

export interface FirebaseToken {
  uid: string;
  email: string | null;
  name: string | null;
  picture?: string | null;
  firebase?: {
    sign_in_provider?: string;
  };
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}

export async function verifyFirebaseToken(idToken: string, projectId?: string): Promise<FirebaseToken> {
  const jwks = getJwks();
  const pid = projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!pid) {
    throw new Error('Firebase project ID not configured. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID.');
  }

  try {
    const { payload } = await jwtVerify(idToken, jwks, {
      issuer: `https://securetoken.google.com/${pid}`,
      audience: pid,
    });

    return {
      uid: payload.sub as string,
      email: (payload.email as string) || null,
      name: (payload.name as string) || null,
      picture: (payload.picture as string) || null,
      firebase: payload.firebase ? {
        sign_in_provider: (payload.firebase as any).sign_in_provider,
      } : undefined,
      iat: payload.iat as number,
      exp: payload.exp as number,
      aud: payload.aud as string,
      iss: payload.iss as string,
    };
  } catch (err: any) {
    throw new Error(`Token verification failed: ${err.message}`);
  }
}

// Check if Firebase should be used (has service account key or Firebase is configured client-side)
export function isFirebaseConfigured(): boolean {
  return !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY || !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
}