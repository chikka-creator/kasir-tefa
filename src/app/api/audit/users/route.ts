import { NextResponse } from "next/server";
import { getSystemUsers, createSystemUser } from "@/lib/audit-data";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await getSystemUsers();
    return NextResponse.json({ success: true, users });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil daftar pengguna.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { username, full_name, role, password, supervisor_pin } = body;

    if (!username || !full_name || !role || !password) {
      return NextResponse.json(
        { error: "Semua bidang wajib (Username, Nama Lengkap, Role, Password) harus diisi." },
        { status: 400 }
      );
    }

    const created = await createSystemUser({
      username,
      full_name,
      role,
      password,
      supervisor_pin,
      creatorId: user?.id,
    });

    return NextResponse.json({
      success: true,
      message: `Akun '${created.username}' berhasil dibuat.`,
      user: created,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat pengguna.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
