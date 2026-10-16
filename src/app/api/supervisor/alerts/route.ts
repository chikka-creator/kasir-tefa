import { NextResponse } from "next/server";
import { getSupervisorAlerts } from "@/lib/supervisor-data";
import { getAuditLogs } from "@/lib/audit-logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const alerts = await getSupervisorAlerts();
    const recentWarningLogs = await getAuditLogs({ limit: 10, severity: "WARNING" });

    return NextResponse.json({
      success: true,
      ...alerts,
      warning_logs: recentWarningLogs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil data alert supervisor.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
