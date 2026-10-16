import { NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/audit-logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get("severity") || undefined;
    const action_type = searchParams.get("action_type") || undefined;
    const limit = Number(searchParams.get("limit") || 50);

    const logs = await getAuditLogs({ severity, action_type, limit });
    return NextResponse.json({ audit_logs: logs });
  } catch (error) {
    console.error("GET /api/audit-logs error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar audit logs." },
      { status: 500 }
    );
  }
}
