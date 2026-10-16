
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type UserRole = "AUDIT" | "TEACHER" | "ADMIN";

export interface UserSessionPayload {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  [key: string]: unknown;
}

export const AUTH_COOKIE_NAME = "tefa_auth_session";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET || "tefa-pos-default-fallback-secret-key-32-chars-long";
  return new TextEncoder().encode(secret);
}

/**
 * Membuat JWT session token dengan durasi 24 jam.
 * Mendukung concurrent session untuk akun ADMIN (tidak me-reset session di perangkat lain).
 */
export async function signAuthToken(payload: UserSessionPayload): Promise<string> {
  const secret = getSecretKey();
  const maxAge = Number(process.env.SESSION_MAX_AGE || 86400);

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(secret);
}

/**
 * Memverifikasi JWT session token.
 * Kompatibel dengan Edge Runtime (Middleware) dan Node.js runtime.
 */
export async function verifyAuthToken(token: string): Promise<UserSessionPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as UserSessionPayload;
  } catch {
    return null;
  }
}

/**
 * Mengambil sesi pengguna saat ini dari cookie (untuk Server Components & Route Handlers).
 */
export async function getCurrentUser(): Promise<UserSessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAuthToken(token);
}
