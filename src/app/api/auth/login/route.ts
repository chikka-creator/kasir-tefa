import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signAuthToken, AUTH_COOKIE_NAME, UserRole } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi." },
        { status: 400 }
      );
    }

    let user: {
      id: string;
      username: string;
      password_hash: string;
      full_name: string;
      role: UserRole;
      is_active: boolean;
    } | null = null;

    try {
      const dbUser = await prisma.user.findUnique({
        where: { username: String(username).trim().toLowerCase() },
      });
      if (dbUser) {
        user = {
          id: dbUser.id,
          username: dbUser.username,
          password_hash: dbUser.password_hash,
          full_name: dbUser.full_name,
          role: dbUser.role as UserRole,
          is_active: dbUser.is_active,
        };
      }
    } catch (dbErr) {
      console.warn("Database connection unavailable, checking default seed accounts fallback:", dbErr);
    }

    // Fallback akun default bila database belum terkoneksi / belum di-seed
    if (!user) {
      const normalizedUsername = String(username).trim().toLowerCase();
      const defaultUsers: Record<string, { id: string; username: string; password: string; full_name: string; role: UserRole }> = {
        kasir_tefa: {
          id: "00000000-0000-0000-0000-000000000001",
          username: "kasir_tefa",
          password: "kasir123",
          full_name: "Admin Kasir Siswa (Shared POS 1 & 2)",
          role: "ADMIN",
        },
        guru_tefa: {
          id: "00000000-0000-0000-0000-000000000002",
          username: "guru_tefa",
          password: "guru123",
          full_name: "Pak Pembimbing TeFa",
          role: "TEACHER",
        },
        audit_sekolah: {
          id: "00000000-0000-0000-0000-000000000003",
          username: "audit_sekolah",
          password: "audit123",
          full_name: "Kepala Unit & Tim Audit",
          role: "AUDIT",
        },
      };

      const matchedDefault = defaultUsers[normalizedUsername];
      if (matchedDefault && matchedDefault.password === password) {
        user = {
          id: matchedDefault.id,
          username: matchedDefault.username,
          password_hash: "",
          full_name: matchedDefault.full_name,
          role: matchedDefault.role,
          is_active: true,
        };
      }
    }

    if (!user || !user.is_active) {
      return NextResponse.json(
        { error: "Username atau password tidak valid." },
        { status: 401 }
      );
    }

    // Jika user berasal dari database, cek hash bcrypt
    if (user.password_hash) {
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Username atau password tidak valid." },
          { status: 401 }
        );
      }
    }

    // Role redirect URL
    let redirectUrl = "/kasir";
    if (user.role === "TEACHER") redirectUrl = "/guru";
    if (user.role === "AUDIT") redirectUrl = "/audit";

    const sessionPayload = {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
    };

    const token = await signAuthToken(sessionPayload);
    const maxAge = Number(process.env.SESSION_MAX_AGE || 86400);

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
      redirectUrl,
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal pada server." },
      { status: 500 }
    );
  }
}
