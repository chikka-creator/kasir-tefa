import { NextResponse } from "next/server";
import { closeActiveShift } from "@/lib/shifts-data";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const shiftId = params.id;
    const body = await request.json();
    const { actual_cash_counted, actual_qris_counted, closing_notes } = body;

    const actualCashNum = Number(actual_cash_counted);
    if (isNaN(actualCashNum) || actualCashNum < 0) {
      return NextResponse.json(
        { error: "Hitungan uang tunai fisik laci wajib diisi dan harus berupa angka valid." },
        { status: 400 }
      );
    }

    const closedShift = await closeActiveShift(shiftId, {
      actual_cash_counted: actualCashNum,
      actual_qris_counted: actual_qris_counted !== undefined ? Number(actual_qris_counted) : undefined,
      closing_notes: closing_notes ? String(closing_notes).trim() : undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Shift #${closedShift.shift_code} berhasil ditutup dan menunggu verifikasi guru.`,
      shift: closedShift,
    });
  } catch (error: unknown) {
    console.error("POST /api/shifts/[id]/close error:", error);
    const msg = error instanceof Error ? error.message : "Gagal menutup sesi shift.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
