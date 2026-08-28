// ============================================================
// Firebase ID Token Verifier — Server-side only
//
// Verifies Firebase ID tokens using:
// 1. Official Firebase Admin SDK (with service account credential)
// 2. RS256 cryptographic verification using Google's public X.509 certs
// 3. Google OAuth2 tokeninfo verification endpoint
// ============================================================
import { getFirebaseAuth } from "@/lib/firebase/admin";
import jwt from "jsonwebtoken";

const CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let certsCache: Record<string, string> | null = null;
let certsCacheExpiresAt = 0;

async function getFirebasePublicCerts(force = false): Promise<Record<string, string>> {
  if (!force && certsCache && Date.now() < certsCacheExpiresAt) {
    return certsCache;
  }
  const res = await fetch(CERTS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const cacheControl = res.headers.get("cache-control") ?? "";
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeSeconds = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;
  certsCache = (await res.json()) as Record<string, string>;
  certsCacheExpiresAt = Date.now() + maxAgeSeconds * 1000;
  return certsCache;
}

export interface FirebaseTokenPayload {
  uid: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

/**
 * Verify a Firebase ID token completely server-side.
 */
export async function verifyFirebaseIdToken(
  idToken: string
): Promise<FirebaseTokenPayload> {
  if (!idToken || typeof idToken !== "string") {
    throw new Error("Invalid or missing Firebase ID token.");
  }

  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    "only-chemistry";

  // ── Method 1: Official Firebase Admin SDK ──────────────────────
  try {
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(idToken, true);

    if (decodedToken.email) {
      return {
        uid: decodedToken.uid,
        email: decodedToken.email.toLowerCase().trim(),
        email_verified: Boolean(decodedToken.email_verified),
        name: decodedToken.name,
        picture: decodedToken.picture,
      };
    }
  } catch (adminError: any) {
    console.warn("[FIREBASE-ADMIN] verifyIdToken error:", adminError?.message || adminError);
  }

  // ── Method 2: RS256 verification using Google public X.509 certs ─
  try {
    const decoded = jwt.decode(idToken, { complete: true });
    if (decoded && typeof decoded !== "string" && decoded.header?.kid) {
      const kid = decoded.header.kid as string;
      let certs = await getFirebasePublicCerts();
      let certificate = certs[kid];

      if (!certificate) {
        certs = await getFirebasePublicCerts(true);
        certificate = certs[kid];
      }

      if (certificate) {
        const payload = jwt.verify(idToken, certificate, {
          algorithms: ["RS256"],
          audience: projectId,
          issuer: `https://securetoken.google.com/${projectId}`,
        }) as jwt.JwtPayload;

        if (payload.sub && payload.email) {
          return {
            uid: payload.sub,
            email: (payload.email as string).toLowerCase().trim(),
            email_verified: Boolean(payload.email_verified),
            name: payload.name as string | undefined,
            picture: payload.picture as string | undefined,
          };
        }
      }
    }
  } catch (certError: any) {
    console.warn("[CERT-VERIFY] Public cert verify failed:", certError?.message);
  }

  // ── Method 3: Google tokeninfo verification ────────────────────
  try {
    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { cache: "no-store" }
    );

    if (tokenInfoRes.ok) {
      const data = await tokenInfoRes.json();
      const audMatches = data.aud === projectId || data.app_id === projectId;
      const issMatches =
        data.iss === `https://securetoken.google.com/${projectId}` ||
        data.iss === "https://accounts.google.com" ||
        data.iss === "accounts.google.com";

      if (audMatches && issMatches && data.email) {
        return {
          uid: data.user_id || data.sub || data.uid,
          email: data.email.toLowerCase().trim(),
          email_verified: data.email_verified === "true" || data.email_verified === true,
          name: data.name,
          picture: data.picture,
        };
      }
    }
  } catch (fallbackError: any) {
    console.warn("[TOKENINFO-VERIFY] tokeninfo verification error:", fallbackError?.message);
  }

  throw new Error("Unable to verify Google authentication token. Please sign in again.");
}
