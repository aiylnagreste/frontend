import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/dashboard", "/bookings", "/clients", "/staff", "/packages", "/deals", "/reports", "/settings"];

const SUPER_PROTECTED = [
  "/super-admin/dashboard",
  "/super-admin/plans",
  "/super-admin/payments",
  "/super-admin/change-password",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Legacy Express path — redirect to Next.js dashboard
  if (pathname === "/salon-admin/dashboard" || pathname.startsWith("/salon-admin/dashboard/")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Already-authenticated users must not reach login pages
  if (pathname === "/login") {
    const tenantToken = req.cookies.get("tenantToken");
    if (tenantToken) return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (pathname === "/super-admin/login") {
    const superToken = req.cookies.get("superAdminSession");
    if (superToken) return NextResponse.redirect(new URL("/super-admin/dashboard", req.url));
  }

  // Super admin routes
  if (SUPER_PROTECTED.some((p) => pathname.startsWith(p))) {
    const superToken = req.cookies.get("superAdminSession");
    if (!superToken) {
      return NextResponse.redirect(new URL("/super-admin/login", req.url));
    }
  }

  // Tenant admin routes
  if (PROTECTED.some((p) => pathname.startsWith(p))) {
    const tenantToken = req.cookies.get("tenantToken");
    if (!tenantToken) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Root: authenticated tenants go to dashboard, guests see the landing page
  if (pathname === "/") {
    const tenantToken = req.cookies.get("tenantToken");
    if (tenantToken) return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/super-admin/login",
    "/salon-admin/dashboard",
    "/salon-admin/dashboard/:path*",
    "/dashboard/:path*",
    "/bookings/:path*",
    "/clients/:path*",
    "/staff/:path*",
    "/packages/:path*",
    "/deals/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/super-admin/dashboard",
    "/super-admin/dashboard/:path*",
    "/super-admin/plans",
    "/super-admin/plans/:path*",
    "/super-admin/payments",
    "/super-admin/payments/:path*",
    "/super-admin/change-password",
    "/super-admin/change-password/:path*",
  ],
};
