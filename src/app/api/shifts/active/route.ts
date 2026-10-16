import { NextResponse } from "next/server";
import { getActiveShiftWithSummary } from "@/lib/shifts-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getActiveShiftWithSummary();
    if (!data) {
      return NextResponse.json({ active: false, shift: null, summary: null });
    }

    return NextResponse.json({
      active: true,
      shift: data.shift,
      summary: data.summary,
    });
  } catch (error) {
    console.error("GET /api/shifts/active error:", error);
    return NextResponse.json(
      { error: "Gagal memuat status shift aktif." },
      { status: 500 }
    );
  }
}
