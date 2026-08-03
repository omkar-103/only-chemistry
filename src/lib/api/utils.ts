// ============================================================
// API Utilities — Response helpers, rate limiting, validation
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/types";
import { verifyAccessToken, extractBearerToken, JWTPayload } from "@/lib/auth/jwt";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import AuditLog from "@/lib/db/models/AuditLog";

// ── Response Helpers ──────────────────────────────────────────

export function successResponse<T>(
  data: T,
  message: string = "Success",
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function errorResponse(
  message: string,
  status: number = 400,
  error?: string
): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, message, error: error || message },
    { status }
  );
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message: string = "Success"
): NextResponse<ApiResponse<T[]>> {
  return NextResponse.json({
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// ── Auth Middleware ───────────────────────────────────────────

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Extract and verify the current user from request headers.
 * Returns user payload or null.
 */
export async function getAuthUser(
  req: NextRequest
): Promise<JWTPayload | null> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return null;

  try {
    const decoded = verifyAccessToken(token);

    // Verify the user still exists and is active
    await connectDB();
    const user = await User.findById(decoded.userId)
      .select("+sessionToken isActive")
      .lean();

    if (!user || !user.isActive) return null;

    // Session token check — only reject if the user HAS a session token set
    // AND it doesn't match. If sessionToken is null/undefined (old accounts),
    // allow access to prevent lockouts.
    if (user.sessionToken && decoded.sessionToken && user.sessionToken !== decoded.sessionToken) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

/**
 * Require authentication — returns user or 401 response
 */
export async function requireAuth(
  req: NextRequest
): Promise<{ user: JWTPayload } | NextResponse> {
  const user = await getAuthUser(req);
  if (!user) {
    return errorResponse("Authentication required. Please log in.", 401);
  }
  return { user };
}

/**
 * Require admin role
 */
export async function requireAdmin(
  req: NextRequest
): Promise<{ user: JWTPayload } | NextResponse> {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;
  if (result.user.role !== "admin") {
    return errorResponse("Admin access required", 403);
  }
  return result;
}

// ── Rate Limiting ─────────────────────────────────────────────
// Simple in-memory rate limiter (for production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 15 * 60 * 1000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const key = identifier;
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}

// ── Client IP Helper ──────────────────────────────────────────
export function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// ── Audit Logging ─────────────────────────────────────────────
export async function createAuditLog(params: {
  userId?: string;
  userName?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  severity?: "info" | "warning" | "error" | "critical";
}): Promise<void> {
  try {
    await connectDB();
    await AuditLog.create(params);
  } catch (error) {
    console.error("[AUDIT] Failed to create audit log:", error);
  }
}

// ── Input Sanitization ────────────────────────────────────────
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "") // basic XSS prevention
    .trim()
    .substring(0, 10000); // length limit
}

// ── Pagination Parser ─────────────────────────────────────────
export function parsePagination(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));
  return { page, limit, skip: (page - 1) * limit };
}
