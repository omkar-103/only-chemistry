// ============================================================
// Firebase Client — Authentication only (Google Sign-In)
// Analytics intentionally NOT initialized.
// ============================================================
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCAl2kPF_zLkma0MmSEjfG3WB-7r17b5bU",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "only-chemistry.firebaseapp.com",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "only-chemistry",
  storageBucket:     "only-chemistry.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "625338778837",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:625338778837:web:5d8e878510a50cee6c4e5c",
};

// Prevent duplicate initialization in Next.js hot-reload / multiple imports.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const firebaseAuth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");
googleProvider.setCustomParameters({ prompt: "select_account" });
