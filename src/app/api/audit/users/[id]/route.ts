import { NextResponse } from "next/server";
import { toggleUserActiveStatus, resetUserCredentials } from "@/lib/audit-data";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { action, new_password, new_pin } = body;

    if (action === "TOGGLE_ACTIVE") {
      const updated = await toggleUserActiveStatus(params.id, user?.id);
      return NextResponse.json({
        success: true,
        message: `Status akun '${updated.username}' berhasil diperbarui.`,
        user: updated,
      });
    }

    if (action === "RESET_CREDENTIALS") {
      if (!new_password && !new_pin) {
        return NextResponse.json(
          { error: "Password baru atau PIN baru wajib diisi." },
          { status: 400 }
        );
      }

      await resetUserCredentials(
        params.id,
        { new_password, new_pin },
        user?.id
      );

      return NextResponse.json({
        success: true,
        message: "Kredensial pengguna berhasil diperbarui.",
      });
    }

    return NextResponse.json(
      { error: "Aksi tidak dikenali. Pilih TOGGLE_ACTIVE atau RESET_CREDENTIALS." },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui pengguna.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
