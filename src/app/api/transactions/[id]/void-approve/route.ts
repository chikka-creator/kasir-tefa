import { NextResponse } from "next/server";
import { approveVoidTransaction } from "@/lib/supervisor-data";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { action, teacher_notes } = body;

    if (!action || (action !== "APPROVE" && action !== "REJECT")) {
      return NextResponse.json(
        { error: "Aksi tidak valid. Pilih APPROVE atau REJECT." },
        { status: 400 }
      );
    }

    const result = await approveVoidTransaction(params.id, action, teacher_notes, {
      user_id: user?.id,
      user_role: user?.role || "TEACHER",
    });

    const msg =
      action === "APPROVE"
        ? "Pembatalan transaksi berhasil disetujui. Stok barang fisik telah dikembalikan."
        : "Pengajuan pembatalan transaksi telah ditolak.";

    return NextResponse.json({
      success: true,
      message: msg,
      status: result.status,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memproses persetujuan void.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
