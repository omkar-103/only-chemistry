// ============================================================
// JWT Utilities — Access & Refresh Token Management
// ============================================================

import jwt, { SignOptions } from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  console.error("❌ [JWT] JWT secrets are not defined in environment variables!");
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: "student" | "admin";
  sessionToken: string;
}

export interface DecodedToken extends JWTPayload {
  iat: number;
  exp: number;
}

/**
 * Generate a short-lived access token (15 minutes)
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: "15m",
    issuer: "rhg-exam-portal",
    audience: "rhg-users",
  } as SignOptions);
}

/**
 * Generate a long-lived refresh token (7 days)
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: "7d",
    issuer: "rhg-exam-portal",
    audience: "rhg-users",
  } as SignOptions);
}

/**
 * Verify access token — returns payload or throws
 */
export function verifyAccessToken(token: string): DecodedToken {
  try {
    return jwt.verify(token, ACCESS_SECRET, {
      issuer: "rhg-exam-portal",
      audience: "rhg-users",
    }) as DecodedToken;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Access token expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid access token");
    }
    throw error;
  }
}

/**
 * Verify refresh token — returns payload or throws
 */
export function verifyRefreshToken(token: string): DecodedToken {
  try {
    return jwt.verify(token, REFRESH_SECRET, {
      issuer: "rhg-exam-portal",
      audience: "rhg-users",
    }) as DecodedToken;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Refresh token expired. Please log in again.");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid refresh token");
    }
    throw error;
  }
}

/**
 * Generate a cryptographically secure session token
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  // Use Node.js crypto for server-side
  const { randomBytes } = require("crypto");
  return randomBytes(32).toString("hex");
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.substring(7);
}
