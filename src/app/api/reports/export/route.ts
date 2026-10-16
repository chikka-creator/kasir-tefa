import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getFinancialAnalytics } from "@/lib/audit-data";
import { getRecentSpoilageList } from "@/lib/inventory-data";
import { getAuditLogs } from "@/lib/audit-logger";
import { ShiftRecord } from "@/lib/shifts-data";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const analytics = await getFinancialAnalytics();
    const spoilage = await getRecentSpoilageList();
    const auditLogs = await getAuditLogs({ limit: 100 });

    let allShifts: ShiftRecord[] = [];
    try {
      const dbShifts = await prisma.shift.findMany({
        orderBy: { opened_at: "desc" },
      });
      if (dbShifts && dbShifts.length > 0) {
        allShifts = dbShifts.map((s) => ({
          id: s.id,
          shift_code: s.shift_code,
          student_worker_1: s.student_worker_1,
          student_worker_2: s.student_worker_2,
          student_worker_3: s.student_worker_3,
          student_supervisor: s.student_supervisor,
          opened_at: s.opened_at.toISOString(),
          closed_at: s.closed_at ? s.closed_at.toISOString() : null,
          status: s.status,
          opening_cash: Number(s.opening_cash),
          expected_cash: s.expected_cash ? Number(s.expected_cash) : null,
          actual_cash_counted: s.actual_cash_counted ? Number(s.actual_cash_counted) : null,
          cash_variance: s.cash_variance ? Number(s.cash_variance) : null,
          variance_status: s.variance_status,
          expected_qris: s.expected_qris ? Number(s.expected_qris) : null,
          actual_qris_counted: s.actual_qris_counted ? Number(s.actual_qris_counted) : null,
          closing_notes: s.closing_notes,
          teacher_score: s.teacher_score,
          teacher_evaluation_notes: s.teacher_evaluation_notes,
          audited_at: s.audited_at ? s.audited_at.toISOString() : null,
          audited_by: s.audited_by,
        }));
      }
    } catch {
      // Memory store fallback
    }

    if (allShifts.length === 0) {
      allShifts = (globalThis as unknown as { __tefa_shifts?: ShiftRecord[] }).__tefa_shifts || [];
    }

    const wb = XLSX.utils.book_new();

    // 1. Sheet Ringkasan Keuangan
    const kpiRows = [
      ["LAPORAN EKSEKUTIF KEUANGAN & LABA RUGI TEFA PERCETAKAN"],
      ["SMK UNIT PRODUKSI & BISNIS"],
      ["Tanggal Cetak:", new Date().toLocaleDateString("id-ID"), "Waktu:", new Date().toLocaleTimeString("id-ID")],
      [],
      ["INDIKATOR KEUANGAN", "NILAI (RUPIAH)", "KETERANGAN"],
      ["Total Omzet Kotor (Gross Revenue)", analytics.kpi.gross_revenue, "Total penjualan lunas Tunai + QRIS"],
      ["Total Harga Pokok Penjualan (HPP / COGS)", analytics.kpi.total_cogs, "Biaya modal kertas, tinta & bahan"],
      ["Total Kerugian Barang Rusak / Salah Print", analytics.kpi.total_spoilage_loss, "Pengurangan nilai modal kerusakan"],
      ["LABA BERSIH RIIL (NET PROFIT)", analytics.kpi.net_profit, "Omzet - HPP - Kerugian Spoilage"],
      [],
      ["METODE PEMBAYARAN", "TOTAL TRANSAKSI", "NOMINAL (RUPIAH)"],
      ["Tunai (Cash Laci)", analytics.payment_breakdown.cash.count, analytics.payment_breakdown.cash.amount],
      ["Non-Tunai (QRIS Statis)", analytics.payment_breakdown.qris.count, analytics.payment_breakdown.qris.amount],
      [],
      ["PERFORMA TERMINAL KASIR", "TOTAL TRANSAKSI", "NOMINAL (RUPIAH)"],
      ["Perangkat Kasir 1 (POS_1)", analytics.terminal_breakdown.pos_1.count, analytics.terminal_breakdown.pos_1.amount],
      ["Perangkat Kasir 2 (POS_2)", analytics.terminal_breakdown.pos_2.count, analytics.terminal_breakdown.pos_2.amount],
      [],
      ["KESEHATAN KAS FISIK LACI", "STATUS", "KETERANGAN"],
      ["Persentase Akurasi Kas Pas", `${analytics.kpi.cash_accuracy_rate}%`, "Shift berstatus BALANCE"],
      ["Akumulasi Selisih Kas (Net)", analytics.kpi.net_variance, "Total selisih fisik laci vs sistem"],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(kpiRows);
    XLSX.utils.book_append_sheet(wb, ws1, "Ringkasan Finansial");

    // 2. Sheet Rekap Shift Siswa
    const shiftHeaders = [
      "Kode Shift",
      "Status",
      "Petugas 1",
      "Petugas 2",
      "Petugas 3",
      "Pengawas",
      "Waktu Buka",
      "Waktu Tutup",
      "Modal Awal (Rp)",
      "Target Kas (Rp)",
      "Uang Fisik (Rp)",
      "Selisih Kas (Rp)",
      "Status Selisih",
      "Skor Nilai Guru",
      "Berita Acara Evaluasi",
    ];
    const shiftDataRows = allShifts.map((s) => [
      s.shift_code,
      s.status,
      s.student_worker_1,
      s.student_worker_2,
      s.student_worker_3,
      s.student_supervisor,
      s.opened_at,
      s.closed_at || "-",
      s.opening_cash,
      s.expected_cash || 0,
      s.actual_cash_counted || 0,
      s.cash_variance || 0,
      s.variance_status || "-",
      s.teacher_score ?? "-",
      s.teacher_evaluation_notes || "-",
    ]);
    const ws2 = XLSX.utils.aoa_to_sheet([shiftHeaders, ...shiftDataRows]);
    XLSX.utils.book_append_sheet(wb, ws2, "Rekap Shift Siswa");

    // 3. Sheet Spoilage / Salah Print
    const spoilageHeaders = [
      "ID Mutasi",
      "Waktu Kejadian",
      "SKU Produk",
      "Nama Produk",
      "Kategori Kerusakan",
      "Qty Rusak",
      "HPP Satuan (Rp)",
      "Total Kerugian (Rp)",
      "Catatan Kronologi",
    ];
    const spoilageDataRows = spoilage.map((m) => [
      m.id,
      m.created_at,
      m.product_sku,
      m.product_name,
      m.reason_category || "-",
      Math.abs(m.qty_change),
      m.cost_price_snapshot,
      m.loss_value || Math.abs(m.qty_change) * m.cost_price_snapshot,
      m.notes,
    ]);
    const ws3 = XLSX.utils.aoa_to_sheet([spoilageHeaders, ...spoilageDataRows]);
    XLSX.utils.book_append_sheet(wb, ws3, "Kerusakan & Spoilage");

    // 4. Sheet Audit Trail
    const auditHeaders = [
      "ID Log",
      "Waktu (WIB)",
      "Tingkat (Severity)",
      "Role Pengguna",
      "Tipe Aksi",
      "Entitas",
      "Deskripsi Aktivitas",
    ];
    const auditDataRows = auditLogs.map((l) => [
      l.id,
      l.created_at,
      l.severity,
      l.user_role,
      l.action_type,
      l.entity_name,
      l.description,
    ]);
    const ws4 = XLSX.utils.aoa_to_sheet([auditHeaders, ...auditDataRows]);
    XLSX.utils.book_append_sheet(wb, ws4, "Log Audit Forensik");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const nowStr = new Date().toISOString().slice(0, 10);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Laporan_Audit_TeFa_Percetakan_${nowStr}.xlsx"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengekspor laporan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
