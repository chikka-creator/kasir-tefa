import { NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/audit-logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get("severity") || undefined;
    const action_type = searchParams.get("action_type") || undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 100;

    const logs = await getAuditLogs({
      severity: severity && severity !== "ALL" ? severity : undefined,
      action_type: action_type && action_type !== "ALL" ? action_type : undefined,
      limit,
    });

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil log audit.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
