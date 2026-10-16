import { NextResponse } from "next/server";
import { openNewShift } from "@/lib/shifts-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      student_worker_1,
      student_worker_2,
      student_worker_3,
      student_supervisor,
      opening_cash,
    } = body;

    if (!student_worker_1 || !student_worker_2 || !student_worker_3 || !student_supervisor) {
      return NextResponse.json(
        { error: "Nama 3 Siswa Bertugas dan 1 Siswa Pengawas wajib diisi." },
        { status: 400 }
      );
    }

    const openingCashNum = Number(opening_cash);
    if (isNaN(openingCashNum) || openingCashNum < 0) {
      return NextResponse.json(
        { error: "Nominal modal awal kas laci tidak valid." },
        { status: 400 }
      );
    }

    const newShift = await openNewShift({
      student_worker_1: String(student_worker_1).trim(),
      student_worker_2: String(student_worker_2).trim(),
      student_worker_3: String(student_worker_3).trim(),
      student_supervisor: String(student_supervisor).trim(),
      opening_cash: openingCashNum,
    });

    return NextResponse.json({
      success: true,
      message: `Shift #${newShift.shift_code} berhasil dibuka.`,
      shift: newShift,
    });
  } catch (error: unknown) {
    console.error("POST /api/shifts/open error:", error);
    const msg = error instanceof Error ? error.message : "Gagal membuka sesi shift.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
