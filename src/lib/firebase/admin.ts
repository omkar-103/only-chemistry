// ============================================================
// Firebase Admin SDK — Server-Side Initialization ONLY
// NEVER import this file into client-side components.
//
// Reads credentials securely from the FIREBASE_SERVICE_ACCOUNT_JSON
// environment variable.
// ============================================================
import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import type { ServiceAccount } from "firebase-admin";

function getServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    return null;
  }

  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (parsed.private_key) {
      // Ensure escaped newlines in private_key are formatted properly
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }
    return parsed as ServiceAccount;
  } catch (error) {
    console.error("[FIREBASE-ADMIN] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", error);
    return null;
  }
}

export function getFirebaseAdminApp(): App {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0]!;
  }

  const serviceAccount = getServiceAccount();

  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
    });
  }

  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    "only-chemistry";

  return initializeApp({
    projectId,
  });
}

export function getFirebaseAuth(): Auth {
  const app = getFirebaseAdminApp();
  return getAuth(app);
}
