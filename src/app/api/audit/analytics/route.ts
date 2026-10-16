import { NextResponse } from "next/server";
import { getFinancialAnalytics, getVerifiedShiftsForAudit, getAuditedShiftsList } from "@/lib/audit-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const analytics = await getFinancialAnalytics();
    const verifiedShifts = await getVerifiedShiftsForAudit();
    const auditedShifts = await getAuditedShiftsList();

    return NextResponse.json({
      success: true,
      ...analytics,
      verified_shifts: verifiedShifts,
      audited_shifts: auditedShifts,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil data analitik keuangan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
