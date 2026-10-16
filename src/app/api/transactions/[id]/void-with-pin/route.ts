import { NextResponse } from "next/server";
import { voidTransactionWithPin } from "@/lib/supervisor-data";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { pin, reason, device_terminal, shift_id } = body;

    if (!pin) {
      return NextResponse.json(
        { error: "PIN 6-digit Supervisor wajib dimasukkan." },
        { status: 400 }
      );
    }

    if (!reason || String(reason).trim().length < 5) {
      return NextResponse.json(
        { error: "Alasan pembatalan transaksi wajib diisi minimal 5 karakter." },
        { status: 400 }
      );
    }

    const result = await voidTransactionWithPin(params.id, pin, reason, {
      user_id: user?.id,
      user_role: user?.role || "ADMIN",
      device_terminal,
      shift_id,
    });

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil dibatalkan menggunakan PIN Supervisor.",
      transaction: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membatalkan transaksi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
