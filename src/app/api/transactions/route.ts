import { NextResponse } from "next/server";
import {
  createNewTransaction,
  getTransactionsByShift,
  getAllRecentTransactions,
  getActiveShiftWithSummary,
} from "@/lib/shifts-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let shiftId = searchParams.get("shift_id");

    if (!shiftId) {
      const activeData = await getActiveShiftWithSummary();
      if (activeData) {
        shiftId = activeData.shift.id;
      }
    }

    const transactions = shiftId
      ? await getTransactionsByShift(shiftId)
      : await getAllRecentTransactions(50);

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar transaksi." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      shift_id,
      device_terminal,
      items,
      payment_method,
      cash_received,
      cash_change,
      qris_reference,
    } = body;

    if (!shift_id) {
      return NextResponse.json(
        { error: "Tidak ada shift aktif yang terkait dengan transaksi ini." },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Keranjang belanja tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (!payment_method || (payment_method !== "CASH" && payment_method !== "QRIS")) {
      return NextResponse.json(
        { error: "Metode pembayaran harus berupa CASH atau QRIS." },
        { status: 400 }
      );
    }

    const totalAmount = items.reduce((sum: number, it: { subtotal: number }) => sum + it.subtotal, 0);

    // Validasi Tunai
    if (payment_method === "CASH") {
      const received = Number(cash_received);
      if (isNaN(received) || received < totalAmount) {
        return NextResponse.json(
          { error: `Nominal uang tunai diterima (Rp ${received.toLocaleString()}) kurang dari total tagihan (Rp ${totalAmount.toLocaleString()}).` },
          { status: 400 }
        );
      }
    }

    const transaction = await createNewTransaction({
      shift_id,
      device_terminal: device_terminal === "POS_2" ? "POS_2" : "POS_1",
      items,
      payment_method,
      cash_received: payment_method === "CASH" ? Number(cash_received) : undefined,
      cash_change: payment_method === "CASH" ? Number(cash_change || 0) : undefined,
      // Sesuai arahan: QRIS langsung diselesaikan oleh admin tanpa perlu input no referensi pelanggan
      qris_reference: payment_method === "QRIS" ? (qris_reference || "QRIS-STATIS-VERIFIED") : undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Transaksi #${transaction.invoice_number} berhasil dicatat.`,
      transaction,
    });
  } catch (error: unknown) {
    console.error("POST /api/transactions error:", error);
    const msg = error instanceof Error ? error.message : "Gagal memproses transaksi.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
