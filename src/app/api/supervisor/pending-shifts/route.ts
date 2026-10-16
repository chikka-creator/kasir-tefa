import { NextResponse } from "next/server";
import { getPendingShifts } from "@/lib/supervisor-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pendingShifts = await getPendingShifts();
    return NextResponse.json({
      success: true,
      pending_shifts: pendingShifts,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil daftar shift pending.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
