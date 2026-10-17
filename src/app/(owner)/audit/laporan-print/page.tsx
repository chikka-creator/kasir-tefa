"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Printer, ArrowLeft, Building2 } from "lucide-react";
import { ShiftRecord } from "@/lib/shifts-data";

function formatRupiah(val: number): string {
  return `Rp ${Number(val || 0).toLocaleString("id-ID")}`;
}

interface AnalyticsResponse {
  kpi: {
    gross_revenue: number;
    total_cogs: number;
    total_spoilage_loss: number;
    net_profit: number;
    total_transactions: number;
    cash_accuracy_rate: number;
    net_variance: number;
    total_shifts_closed: number;
  };
  payment_breakdown: {
    cash: { amount: number; count: number };
    qris: { amount: number; count: number };
  };
  terminal_breakdown: {
    pos_1: { amount: number; count: number };
    pos_2: { amount: number; count: number };
  };
}

export default function LaporanPrintPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [printDate, setPrintDate] = useState("");

  useEffect(() => {
    setPrintDate(
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    async function loadData() {
      try {
        // Catatan: sebelumnya halaman ini memanggil GET /api/shifts yang tidak pernah
        // ada, sehingga Section II selalu kosong. Data shift sudah disediakan oleh
        // /api/audit/analytics (verified_shifts + audited_shifts).
        const resAnalytics = await fetch("/api/audit/analytics");

        if (resAnalytics.ok) {
          const dataA = await resAnalytics.json();
          setAnalytics(dataA);

          const merged: ShiftRecord[] = [
            ...(dataA.verified_shifts || []),
            ...(dataA.audited_shifts || []),
          ].sort((a, b) => {
            const ta = a.closed_at ? new Date(a.closed_at).getTime() : 0;
            const tb = b.closed_at ? new Date(b.closed_at).getTime() : 0;
            return tb - ta;
          });

          setShifts(merged);
        }
      } catch (err) {
        console.error("Failed to load print report data", err);
      }
    }

    loadData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const kpi = analytics?.kpi;
  const payment = analytics?.payment_breakdown;

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 print:bg-white print:text-black">
      {/* Action Bar (Screen Only) */}
      <div className="print:hidden bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-6 py-3 sm:py-3.5 sticky top-0 z-50 shadow-md">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <Link
            href="/audit"
            className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard Audit</span>
          </Link>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-[11px] text-slate-400 hidden md:inline">
              Format cetak resmi A4 / F4 untuk arsip fisik sekolah
            </span>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sheet Container: A4 Style Page */}
      <div className="max-w-4xl mx-auto my-3 sm:my-6 p-4 sm:p-8 bg-white border border-neutral-300 rounded-lg shadow-lg print:border-none print:shadow-none print:p-0 print:my-0 overflow-x-auto">
        
        {/* 1. KOP SURAT SEKOLAH RESMI */}
        <div className="border-b-4 border-double border-neutral-900 pb-3 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full border-2 border-neutral-900 flex items-center justify-center font-bold text-xl bg-neutral-50 print:bg-transparent">
                <Building2 className="w-8 h-8 text-neutral-800" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wider uppercase text-neutral-600">
                  PEMERINTAH DAERAH PROVINSI JAWA TIMUR / DINAS PENDIDIKAN
                </p>
                <h1 className="text-base sm:text-lg font-black uppercase text-neutral-900 tracking-tight">
                  SMK PUSAT KEUNGGULAN &bull; UNIT PRODUKSI TEACHING FACTORY (TeFa)
                </h1>
                <p className="text-xs font-bold text-neutral-800">
                  DIVISI BISNIS & MANAJEMEN: PERCETAKAN, FOTOCOPY, & ATK
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  Jl. Pendidikan Kejuruan No. 45 &bull; Telp (031) 8899776 &bull; Email: tefa.percetakan@smk.sch.id
                </p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-[9px] font-mono border border-neutral-400 px-2 py-1 rounded">
                DOKUMEN RESMI AUDIT
              </span>
            </div>
          </div>
        </div>

        {/* 2. JUDUL DOKUMEN & METADATA */}
        <div className="text-center my-4">
          <h2 className="text-sm sm:text-base font-extrabold uppercase underline tracking-wide">
            LAPORAN PERTANGGUNGJAWABAN FINANSIAL & AUDIT SHIFT PRAKTIK SISWA
          </h2>
          <p className="text-xs text-neutral-600 mt-1 font-mono">
            Kode Audit: AUD-TEFA-{new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, "0")} | Tanggal Cetak: {printDate}
          </p>
        </div>

        {/* 3. RINGKASAN FINANSIAL OPERASIONAL */}
        <div className="mt-6 mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 bg-neutral-100 px-2 py-1 border-l-4 border-slate-900 mb-2">
            I. Rekapitulasi Finansial & Laba Bersih Operasional
          </h3>
          
          <table className="w-full text-xs border border-neutral-300">
            <tbody>
              <tr className="border-b border-neutral-200">
                <td className="p-2 font-medium bg-neutral-50 w-2/3">Total Pendapatan Kotor (Gross Revenue - Lunas):</td>
                <td className="p-2 text-right font-mono font-bold">
                  {formatRupiah(kpi?.gross_revenue || 0)}
                </td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="p-2 font-medium bg-neutral-50">Harga Pokok Penjualan (HPP / COGS Material Terjual):</td>
                <td className="p-2 text-right font-mono text-red-700">
                  - {formatRupiah(kpi?.total_cogs || 0)}
                </td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="p-2 font-medium bg-neutral-50">Kerugian Spoilage Bahan Rusak / Salah Cetak Siswa:</td>
                <td className="p-2 text-right font-mono text-amber-700">
                  - {formatRupiah(kpi?.total_spoilage_loss || 0)}
                </td>
              </tr>
              <tr className="bg-emerald-50 border-t-2 border-neutral-900 font-bold">
                <td className="p-2.5 text-emerald-950 font-bold">Laba Bersih Operasional TeFa (Net Profit):</td>
                <td className="p-2.5 text-right font-mono text-sm text-emerald-900">
                  {formatRupiah(kpi?.net_profit || 0)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Breakdown Mini Table */}
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="border border-neutral-200 rounded p-2 text-[11px]">
              <span className="font-semibold block mb-1">Rincian Metode Pembayaran:</span>
              <div className="flex justify-between py-0.5">
                <span>Tunai (Cash Fisik):</span>
                <span className="font-mono font-medium">
                  {formatRupiah(payment?.cash.amount || 0)} ({payment?.cash.count || 0} tx)
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span>Non-Tunai (QRIS Statis):</span>
                <span className="font-mono font-medium">
                  {formatRupiah(payment?.qris.amount || 0)} ({payment?.qris.count || 0} tx)
                </span>
              </div>
            </div>

            <div className="border border-neutral-200 rounded p-2 text-[11px]">
              <span className="font-semibold block mb-1">Akurasi Kas Laci (Physical Cash):</span>
              <div className="flex justify-between py-0.5">
                <span>Tingkat Kepatuhan Balance:</span>
                <span className="font-mono font-bold text-emerald-800">
                  {kpi?.cash_accuracy_rate || 100}%
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span>Kumulatif Selisih Kas:</span>
                <span className={`font-mono font-bold ${
                  (kpi?.net_variance || 0) === 0 ? "text-neutral-700" : (kpi?.net_variance || 0) > 0 ? "text-blue-700" : "text-red-700"
                }`}>
                  {(kpi?.net_variance || 0) === 0 ? "Rp 0 (Sempurna)" : formatRupiah(kpi?.net_variance || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. REKAPITULASI SHIFT & KINERJA SISWA */}
        <div className="mt-6 mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 bg-neutral-100 px-2 py-1 border-l-4 border-slate-900 mb-2">
            II. Rekapitulasi Shift Praktik Kasir Siswa & Status Audit
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-[10px] border border-neutral-300">
              <thead className="bg-neutral-100 text-neutral-700 uppercase font-semibold border-b border-neutral-300">
                <tr>
                  <th className="p-1.5 text-left border-r border-neutral-200">No. Shift</th>
                  <th className="p-1.5 text-left border-r border-neutral-200">Kasir Siswa</th>
                  <th className="p-1.5 text-right border-r border-neutral-200">Kas Awal</th>
                  <th className="p-1.5 text-right border-r border-neutral-200">Kas Fisik</th>
                  <th className="p-1.5 text-center border-r border-neutral-200">Selisih</th>
                  <th className="p-1.5 text-center">Status Audit</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((s) => (
                  <tr key={s.id} className="border-b border-neutral-200">
                    <td className="p-1.5 font-mono font-semibold border-r border-neutral-200">
                      {s.shift_code}
                    </td>
                    <td className="p-1.5 border-r border-neutral-200">
                      <div className="font-medium text-neutral-800">{s.student_worker_1} (POS 1)</div>
                      <div className="text-neutral-500">{s.student_worker_2} (POS 2)</div>
                    </td>
                    <td className="p-1.5 text-right font-mono border-r border-neutral-200">
                      {formatRupiah(s.opening_cash)}
                    </td>
                    <td className="p-1.5 text-right font-mono border-r border-neutral-200">
                      {s.actual_cash_counted !== null && s.actual_cash_counted !== undefined
                        ? formatRupiah(s.actual_cash_counted)
                        : "-"}
                    </td>
                    <td className="p-1.5 text-center font-mono border-r border-neutral-200">
                      {s.cash_variance !== null && s.cash_variance !== undefined ? (
                        <span className={s.cash_variance === 0 ? "text-emerald-700 font-bold" : "text-red-700 font-bold"}>
                          {s.cash_variance === 0 ? "PAS (Rp 0)" : formatRupiah(s.cash_variance)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-1.5 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                        s.status === "CLOSED_AUDITED"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : s.status === "VERIFIED_BY_TEACHER"
                          ? "bg-blue-100 text-blue-800 border border-blue-300"
                          : "bg-neutral-100 text-neutral-700"
                      }`}>
                        {s.status === "CLOSED_AUDITED"
                          ? "AUDITED (LENGKAP)"
                          : s.status === "VERIFIED_BY_TEACHER"
                          ? "VERIFIKASI GURU"
                          : s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. CATATAN & KESIMPULAN AUDITOR */}
        <div className="border border-neutral-300 rounded p-3 mb-8 text-[11px] bg-neutral-50 print:bg-transparent">
          <span className="font-bold text-neutral-800 block mb-1">
            Catatan Dewan Evaluasi & Tim Pemeriksa:
          </span>
          <p className="text-neutral-600 leading-relaxed italic">
            &ldquo;Seluruh penerimaan fisik dan non-tunai telah dicocokkan dengan log audit transaksi per kasir. Catatan bahan sisa/rusak telah diverifikasi secara fisik oleh Guru Pembimbing. Laporan ini sah dan dapat diarsipkan sebagai bukti akuntabilitas unit Teaching Factory sekolah.&rdquo;
          </p>
        </div>

        {/* 6. KOLOM TANDA TANGAN RESMI (3 PIHAK) */}
        <div className="grid grid-cols-3 gap-6 text-center text-xs mt-10 pt-4 break-inside-avoid">
          {/* Kolom 1: Kasir Siswa */}
          <div className="flex flex-col justify-between h-32">
            <div>
              <p className="text-neutral-500 text-[11px]">Dibuat & Dihitung oleh,</p>
              <p className="font-semibold text-neutral-800">Kasir Siswa / Pengawas</p>
            </div>
            <div>
              <div className="border-b border-neutral-900 w-36 mx-auto mb-1"></div>
              <p className="font-medium text-[11px]">Siswa Piket Shift TeFa</p>
              <p className="text-[10px] text-neutral-500">NIS. Praktik Kejuruan</p>
            </div>
          </div>

          {/* Kolom 2: Guru Pembimbing */}
          <div className="flex flex-col justify-between h-32">
            <div>
              <p className="text-neutral-500 text-[11px]">Diperiksa & Diverifikasi,</p>
              <p className="font-semibold text-neutral-800">Guru Pembimbing Praktik</p>
            </div>
            <div>
              <div className="border-b border-neutral-900 w-36 mx-auto mb-1"></div>
              <p className="font-medium text-[11px]">Pak Pembimbing TeFa, S.Pd</p>
              <p className="text-[10px] text-neutral-500">NIP. 19850312 201001 1 012</p>
            </div>
          </div>

          {/* Kolom 3: Kepala Unit TeFa */}
          <div className="flex flex-col justify-between h-32">
            <div>
              <p className="text-neutral-500 text-[11px]">Disetujui & Disahkan,</p>
              <p className="font-semibold text-neutral-800">Kepala Unit Produksi TeFa</p>
            </div>
            <div>
              <div className="border-b border-neutral-900 w-36 mx-auto mb-1"></div>
              <p className="font-medium text-[11px]">Drs. H. Mulyono, M.T.</p>
              <p className="text-[10px] text-neutral-500">NIP. 19720415 199802 1 004</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
