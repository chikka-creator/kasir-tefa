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

type UserRole = DecodedSession["role"];

/**
 * Otorisasi API Route Handlers.
 *
 * Peta di bawah adalah SATU-SATUNYA sumber kebenaran RBAC untuk /api/*.
 * Dicocokkan dari atas ke bawah; aturan pertama yang cocok menang.
 * Route yang tidak cocok dengan aturan mana pun akan DITOLAK (default deny),
 * sehingga route baru otomatis terkunci sampai ada yang menambahkannya di sini.
 *
 * CATATAN: sebelumnya middleware hanya melindungi halaman (RBAC /kasir, /guru,
 * /audit). Path /api/:path* ikut di matcher tapi tidak pernah di-branch, sehingga
 * seluruh API terbuka untuk publik.
 */
const API_ACCESS_RULES: { pattern: RegExp; roles: UserRole[] }[] = [
  // Autentikasi & sesi — semua role
  { pattern: /^\/api\/auth\/me$/, roles: ["ADMIN", "TEACHER", "AUDIT"] },
  // Audit / kepsek — hanya AUDIT
  { pattern: /^\/api\/audit\//, roles: ["AUDIT"] },
  { pattern: /^\/api\/reports\//, roles: ["AUDIT"] },
  // Supervisor / guru pembimbing — hanya TEACHER
  { pattern: /^\/api\/supervisor\//, roles: ["TEACHER"] },
  // Log audit — TEACHER (portal guru) & AUDIT (forensik)
  { pattern: /^\/api\/audit-logs$/, roles: ["TEACHER", "AUDIT"] },
  // Shift: aksi verifikasi guru & finalisasi audit dipisah dari operasi kasir
  { pattern: /^\/api\/shifts\/[^/]+\/audit-close$/, roles: ["AUDIT"] },
  { pattern: /^\/api\/shifts\/[^/]+\/verify$/, roles: ["TEACHER"] },
  { pattern: /^\/api\/shifts\//, roles: ["ADMIN", "TEACHER"] },
  // Persetujuan void HANYA guru pembimbing — inilah dual control yang menjaga
  // kasir tidak bisa membatalkan transaksi miliknya sendiri.
  { pattern: /^\/api\/transactions\/[^/]+\/void-approve$/, roles: ["TEACHER"] },
  // Katalog, stok, transaksi — operasi kasir
  {
    pattern: /^\/api\/(products|stock|transactions)(\/|$)/,
    roles: ["ADMIN", "TEACHER"],
  },
  // Default deny: route tak dikenal atas nama ini akan dijawab 403
  { pattern: /^\/api\//, roles: [] },
];

function resolveApiRoles(pathname: string): UserRole[] {
  const rule = API_ACCESS_RULES.find((r) => r.pattern.test(pathname));
  return rule ? rule.roles : [];
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati file statis, aset Next.js, dan endpoint auth publik.
  // Perbandingan exact (bukan startsWith) agar /api/auth/loginX tidak ikut terbebas.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/logout"
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

  // 0. Proteksi API Route Handlers (RBAC per endpoint, default deny)
  if (pathname.startsWith("/api/")) {
    const allowedRoles = resolveApiRoles(pathname);

    if (!user) {
      return NextResponse.json(
        { error: "Sesi tidak ditemukan. Silakan login kembali." },
        { status: 401 }
      );
    }

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Anda tidak memiliki akses ke endpoint ini." },
        { status: 403 }
      );
    }

    return NextResponse.next();
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
