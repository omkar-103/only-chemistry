// ============================================================
// Next.js 16 Proxy (formerly middleware) — Route Protection & JWT Verification
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, verifyRefreshToken, generateAccessToken, extractBearerToken } from "@/lib/auth/jwt";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/terms",
  "/privacy",
];

// API routes that are public (no auth needed)
const PUBLIC_API_ROUTES = [
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/verify-otp",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/refresh",
  "/api/health",
  "/api/admin/categories",  // Public category listing
];

export function proxy(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Allow public page routes
  if (PUBLIC_ROUTES.some((r) => pathname === r)) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (PUBLIC_API_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // For API routes — let the individual route handlers verify auth
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ── Page routes: verify access token ─────────────────────────
  const authHeader = req.headers.get("authorization");
  const cookieToken = req.cookies.get("access_token")?.value;
  const token = extractBearerToken(authHeader) || cookieToken;

  if (!token) {
    // No token at all → redirect to login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Try to verify access token
    const decoded = verifyAccessToken(token);

    // Admin-only routes
    if (pathname.startsWith("/admin") && decoded.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Student-only routes — admins redirect to admin panel
    const studentRoutes = ["/dashboard", "/exams", "/results", "/payments", "/doubts", "/videos", "/profile", "/exam", "/notifications"];
    if (studentRoutes.some(r => pathname.startsWith(r)) && decoded.role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    // Attach user info headers
    const response = NextResponse.next();
    response.headers.set("x-user-id", decoded.userId);
    response.headers.set("x-user-role", decoded.role);
    return response;

  } catch (accessErr) {
    // Access token invalid/expired — try to silently refresh using refresh_token cookie
    const refreshToken = req.cookies.get("refresh_token")?.value;

    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);

        // Issue new access token
        const newAccessToken = generateAccessToken({
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          sessionToken: decoded.sessionToken,
        });

        // Admin-only routes
        if (pathname.startsWith("/admin") && decoded.role !== "admin") {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        // Student-only routes
        const studentRoutes = ["/dashboard", "/exams", "/results", "/payments", "/doubts", "/videos", "/profile", "/exam", "/notifications"];
        if (studentRoutes.some(r => pathname.startsWith(r)) && decoded.role === "admin") {
          return NextResponse.redirect(new URL("/admin", req.url));
        }

        // Continue the request with refreshed token set in cookie
        const response = NextResponse.next();
        response.cookies.set("access_token", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60,
          path: "/",
        });
        response.headers.set("x-user-id", decoded.userId);
        response.headers.set("x-user-role", decoded.role);
        return response;

      } catch {
        // Refresh token also invalid — clear cookies and redirect to login
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("redirect", pathname);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete("access_token");
        response.cookies.delete("refresh_token");
        return response;
      }
    }

    // No refresh token — redirect to login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("access_token");
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
