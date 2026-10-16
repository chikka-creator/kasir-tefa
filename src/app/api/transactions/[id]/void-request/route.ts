import { NextResponse } from "next/server";
import { requestVoidTransaction } from "@/lib/supervisor-data";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { reason, device_terminal, shift_id } = body;

    if (!reason || String(reason).trim().length < 5) {
      return NextResponse.json(
        { error: "Alasan pengajuan pembatalan wajib diisi minimal 5 karakter." },
        { status: 400 }
      );
    }

    const result = await requestVoidTransaction(params.id, reason, {
      user_id: user?.id,
      user_role: user?.role || "ADMIN",
      device_terminal,
      shift_id,
    });

    return NextResponse.json({
      success: true,
      message: "Pengajuan pembatalan transaksi berhasil dikirim ke dashboard Guru Pembimbing.",
      transaction: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengajukan pembatalan transaksi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
