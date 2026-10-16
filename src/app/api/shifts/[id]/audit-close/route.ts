import { NextResponse } from "next/server";
import { finalizeAuditShift } from "@/lib/audit-data";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const result = await finalizeAuditShift(params.id, user?.id);

    return NextResponse.json({
      success: true,
      message: "Shift berhasil ditutup buku secara permanen (CLOSED_AUDITED).",
      shift: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memfinalisasi audit shift.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
