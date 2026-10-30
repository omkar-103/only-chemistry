// ============================================================
// Firebase Admin SDK — Server-Side Initialization ONLY
// NEVER import this file into client-side components.
//
// Reads credentials securely from FIREBASE_SERVICE_ACCOUNT_JSON
// or discrete environment variables.
// ============================================================
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import type { ServiceAccount } from "firebase-admin";

function getServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try {
      let jsonString = typeof raw === "string" ? raw.trim() : raw;
      if (typeof jsonString === "string" && jsonString.startsWith("'") && jsonString.endsWith("'")) {
        jsonString = jsonString.slice(1, -1);
      }
      const parsed = typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
      if (parsed.private_key) {
        // Ensure escaped newlines in private_key are formatted properly
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }
      return parsed as ServiceAccount;
    } catch (error) {
      console.error("[FIREBASE-ADMIN] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", (error as Error).message);
    }
  }

  // Fallback to discrete env variables if set
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "only-chemistry";
  if (clientEmail && privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
    return {
      projectId,
      clientEmail,
      privateKey,
    } as ServiceAccount;
  }

  return null;
}

export function getFirebaseAdminApp(): App {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0]!;
  }

  const serviceAccount = getServiceAccount();

  if (serviceAccount) {
    try {
      const maskedEmail = serviceAccount.clientEmail ? `${serviceAccount.clientEmail.slice(0, 5)}...` : "unknown";
      console.log(`[GOOGLE-AUTH-DIAGNOSTIC] [Stage 3/10] Firebase Admin initialized with service account (${maskedEmail})`);
      return initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (certErr) {
      console.error("[FIREBASE-ADMIN] cert() initialization failed:", (certErr as Error).message);
    }
  }

  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    "only-chemistry";

  console.log(`[GOOGLE-AUTH-DIAGNOSTIC] [Stage 3/10] Firebase Admin initialized with projectId: ${projectId}`);
  return initializeApp({
    projectId,
  });
}

export function getFirebaseAuth(): Auth {
  const app = getFirebaseAdminApp();
  return getAuth(app);
}
