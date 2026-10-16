import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "tefa_auth_session";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET || "tefa-pos-default-fallback-secret-key-32-chars-long";
  return new TextEncoder().encode(secret);
}

interface DecodedSession {
  id: string;
  username: string;
  fullName: string;
  role: "AUDIT" | "TEACHER" | "ADMIN";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati file statis, aset Next.js, dan endpoint auth publik
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  let user: DecodedSession | null = null;

  if (token) {
    try {
      const secret = getSecretKey();
      const { payload } = await jwtVerify(token, secret);
      user = payload as unknown as DecodedSession;
    } catch {
      user = null;
    }
  }

  // 1. Halaman Login
  if (pathname === "/login") {
    if (user) {
      if (user.role === "ADMIN") {
        return NextResponse.redirect(new URL("/kasir", request.url));
      }
      if (user.role === "TEACHER") {
        return NextResponse.redirect(new URL("/guru", request.url));
      }
      if (user.role === "AUDIT") {
        return NextResponse.redirect(new URL("/audit", request.url));
      }
    }
    return NextResponse.next();
  }

  // 2. Root Redirect
  if (pathname === "/") {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (user.role === "ADMIN") {
      return NextResponse.redirect(new URL("/kasir", request.url));
    }
    if (user.role === "TEACHER") {
      return NextResponse.redirect(new URL("/guru", request.url));
    }
    if (user.role === "AUDIT") {
      return NextResponse.redirect(new URL("/audit", request.url));
    }
  }

  // 3. Proteksi Halaman Area Kerja (RBAC Guard)
  // Belum login sama sekali
  if (!user) {
    if (pathname.startsWith("/kasir") || pathname.startsWith("/guru") || pathname.startsWith("/audit")) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Area Kasir: Hanya ADMIN dan TEACHER
  if (pathname.startsWith("/kasir")) {
    if (user.role !== "ADMIN" && user.role !== "TEACHER") {
      return NextResponse.redirect(new URL(user.role === "AUDIT" ? "/audit" : "/login", request.url));
    }
    return NextResponse.next();
  }

  // Area Guru: Hanya TEACHER
  if (pathname.startsWith("/guru")) {
    if (user.role !== "TEACHER") {
      const target = user.role === "ADMIN" ? "/kasir" : "/audit";
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  // Area Audit: Hanya AUDIT
  if (pathname.startsWith("/audit")) {
    if (user.role !== "AUDIT") {
      const target = user.role === "ADMIN" ? "/kasir" : "/guru";
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/kasir/:path*",
    "/guru/:path*",
    "/audit/:path*",
    "/api/:path*",
  ],
};
