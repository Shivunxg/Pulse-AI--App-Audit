// Lightweight Firebase ID token verification without firebase-admin
// Verifies JWTs using Google's public certs directly via jose

let _jwks: any = null;
let _jwksExpiry = 0;

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/jwk';

async function getJwks() {
  if (_jwks && Date.now() < _jwksExpiry) return _jwks;

  const { jose } = await import('jose') as any;
  const response = await fetch(GOOGLE_CERTS_URL);
  const data = await response.json();

  // Build JWKS from Google's format
  const keys = Object.values(data) as any[];
  _jwks = jose.createLocalJWKSet({ keys });
  _jwksExpiry = Date.now() + 6 * 60 * 60 * 1000; // cache for 6 hours
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
  const { jose } = await import('jose') as any;
  const jwks = await getJwks();
  const pid = projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  try {
    const { payload } = await jose.jwtVerify(idToken, jwks, {
      issuer: `https://securetoken.google.com/${pid}`,
      audience: pid,
    });

    return {
      uid: payload.sub,
      email: payload.email || null,
      name: payload.name || null,
      picture: payload.picture || null,
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