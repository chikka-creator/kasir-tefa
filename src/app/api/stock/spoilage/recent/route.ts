import { NextResponse } from "next/server";
import { getRecentSpoilageList } from "@/lib/inventory-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shiftId = searchParams.get("shift_id");
    const list = await getRecentSpoilageList(shiftId);
    return NextResponse.json({ spoilage_reports: list });
  } catch (error) {
    console.error("GET /api/stock/spoilage/recent error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar laporan barang rusak." },
      { status: 500 }
    );
  }
}
