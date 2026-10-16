"use client";

import React, { useState } from "react";
import {
  X,
  CheckSquare,
  Users,
  Banknote,
  CreditCard,
  AlertTriangle,
  Scale,
  Award,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { ShiftRecord } from "@/lib/shifts-data";

export interface EnrichedShiftItem extends ShiftRecord {
  summary?: {
    total_transactions: number;
    cash_sales: number;
    qris_sales: number;
    spoilage_count: number;
    spoilage_loss: number;
  };
}

interface VerifyShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: EnrichedShiftItem | null;
  onVerifiedSuccess: () => void;
}

export function VerifyShiftModal({
  isOpen,
  onClose,
  shift,
  onVerifiedSuccess,
}: VerifyShiftModalProps) {
  const [score, setScore] = useState<number>(90);
  const [evaluationNotes, setEvaluationNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  if (!isOpen || !shift) return null;

  const openingCash = shift.opening_cash || 0;
  const cashSales = shift.summary?.cash_sales || 0;
  const qrisSales = shift.summary?.qris_sales || 0;
  const expectedCash = shift.expected_cash || openingCash + cashSales;
  const actualCash = shift.actual_cash_counted || 0;
  const variance = shift.cash_variance || actualCash - expectedCash;
  const varianceStatus = shift.variance_status || (variance === 0 ? "BALANCE" : variance < 0 ? "MINUS" : "PLUS");

  const getGradeInfo = (val: number) => {
    if (val >= 90) return { label: "Sangat Baik (A)", color: "text-emerald-700 bg-emerald-100 border-emerald-300" };
    if (val >= 80) return { label: "Baik (B)", color: "text-blue-700 bg-blue-100 border-blue-300" };
    if (val >= 70) return { label: "Cukup (C)", color: "text-amber-700 bg-amber-100 border-amber-300" };
    return { label: "Perlu Bimbingan (D)", color: "text-rose-700 bg-rose-100 border-rose-300" };
  };

  const grade = getGradeInfo(score);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (score < 0 || score > 100) {
      setErrorMessage("Skor penilaian wajib berada dalam rentang 0 hingga 100.");
      return;
    }

    if (!evaluationNotes || evaluationNotes.trim().length === 0) {
      setErrorMessage("Catatan evaluasi / berita acara Guru Pembimbing wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/shifts/${shift.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacher_score: score,
          teacher_evaluation_notes: evaluationNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memverifikasi shift.");
      }

      setSuccessMessage("Shift berhasil diverifikasi dan disahkan! Diteruskan ke Role Audit.");
      setTimeout(() => {
        onClose();
        onVerifiedSuccess();
      }, 1300);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memverifikasi shift.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-xl border border-subtle bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-subtle px-5 py-4 bg-amber-50/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white font-bold text-sm shadow-xs">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-ink">Verifikasi Tutup Shift & Penilaian Tim</h2>
                <span className="text-[10px] font-mono font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                  #{shift.shift_code}
                </span>
              </div>
              <p className="text-[11px] text-ink-muted">
                Tinjau rekonsiliasi kas gabungan, evaluasi selisih, dan berikan skor mutu piket siswa.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. Tim Siswa Bertugas */}
          <div className="p-3.5 rounded-xl border border-subtle bg-neutral-50/70 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <Users className="w-4 h-4 text-primary" />
              <span>Tim Siswa Piket Kasir TeFa</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-white border border-subtle">
                <span className="text-ink-muted text-[10px] block">Petugas 1:</span>
                <span className="font-semibold text-ink">{shift.student_worker_1}</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-subtle">
                <span className="text-ink-muted text-[10px] block">Petugas 2:</span>
                <span className="font-semibold text-ink">{shift.student_worker_2}</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-subtle">
                <span className="text-ink-muted text-[10px] block">Petugas 3:</span>
                <span className="font-semibold text-ink">{shift.student_worker_3}</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-subtle bg-sky-50/40">
                <span className="text-sky-700 text-[10px] block font-semibold">Pengawas:</span>
                <span className="font-bold text-sky-900">{shift.student_supervisor}</span>
              </div>
            </div>
          </div>

          {/* 2. Rekonsiliasi Kas Laci Fisik Gabungan */}
          <div className="p-4 rounded-xl border border-subtle bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-subtle pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <Scale className="w-4 h-4 text-emerald-600" />
                <span>Rekonsiliasi Kas Laci (POS 1 + POS 2)</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                varianceStatus === "BALANCE"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : varianceStatus === "MINUS"
                  ? "bg-rose-100 text-rose-800 border-rose-300"
                  : "bg-amber-100 text-amber-800 border-amber-300"
              }`}>
                {varianceStatus === "BALANCE"
                  ? "Kas Pas (Balance)"
                  : varianceStatus === "MINUS"
                  ? `Selisih Kurang (-Rp ${Math.abs(variance).toLocaleString("id-ID")})`
                  : `Selisih Lebih (+Rp ${Math.abs(variance).toLocaleString("id-ID")})`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-neutral-50 border border-subtle">
                <span className="text-ink-muted text-[10px] block">Modal Awal Laci:</span>
                <span className="font-mono font-bold text-ink">
                  Rp {openingCash.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-50 border border-subtle">
                <span className="text-ink-muted text-[10px] block flex items-center gap-1">
                  <Banknote className="w-3 h-3 text-emerald-600" />
                  Penjualan Tunai:
                </span>
                <span className="font-mono font-bold text-emerald-700">
                  + Rp {cashSales.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-50 border border-subtle">
                <span className="text-ink-muted text-[10px] block flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-blue-600" />
                  Penjualan QRIS:
                </span>
                <span className="font-mono font-bold text-blue-700">
                  Rp {qrisSales.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-50 border border-subtle">
                <span className="text-ink-muted text-[10px] block">Target Kas Sistem:</span>
                <span className="font-mono font-bold text-ink">
                  Rp {expectedCash.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-50 border border-subtle">
                <span className="text-ink-muted text-[10px] block">Uang Fisik Dihitung:</span>
                <span className="font-mono font-bold text-ink">
                  Rp {actualCash.toLocaleString("id-ID")}
                </span>
              </div>

              <div className={`p-2.5 rounded-lg border ${
                varianceStatus === "BALANCE"
                  ? "bg-emerald-50/60 border-emerald-200"
                  : "bg-rose-50/60 border-rose-200"
              }`}>
                <span className="text-ink-muted text-[10px] block">Selisih Kas Akhir:</span>
                <span className={`font-mono font-bold ${
                  varianceStatus === "BALANCE" ? "text-emerald-700" : "text-rose-700"
                }`}>
                  Rp {variance.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Spoilage info */}
            {shift.summary && shift.summary.spoilage_count > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Tercatat <strong>{shift.summary.spoilage_count} kejadian</strong> salah print / barang rusak pada shift ini.
                  </span>
                </div>
                <span className="font-mono font-bold text-amber-900">
                  Kerugian HPP: Rp {shift.summary.spoilage_loss.toLocaleString("id-ID")}
                </span>
              </div>
            )}

            {shift.closing_notes && (
              <div className="p-2.5 rounded-lg bg-neutral-50 border border-subtle text-[11px] text-ink-muted">
                <span className="font-semibold text-ink">Catatan Kasir Siswa: </span>
                <span className="italic">&quot;{shift.closing_notes}&quot;</span>
              </div>
            )}
          </div>

          {/* 3. Form Evaluasi & Penilaian Akademik */}
          <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Form Penilaian & Berita Acara Guru</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${grade.color}`}>
                Grade: {grade.label}
              </span>
            </div>

            {/* Slider / Number Input for Score */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-ink">
                  Skor Nilai Tim Siswa (0–100):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={score}
                    onChange={(e) => setScore(Math.max(0, Math.min(100, Number(e.target.value))))}
                    className="w-16 px-2 py-1 text-center font-mono font-bold text-sm rounded-lg border border-subtle focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  />
                  <span className="text-xs text-ink-muted">/ 100</span>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-ink-muted px-1 mt-0.5">
                <span>0 (Kurang)</span>
                <span>70 (Standar KKM)</span>
                <span>85 (Baik)</span>
                <span>100 (Sempurna)</span>
              </div>
            </div>

            {/* Berita Acara Textarea */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1 flex items-center justify-between">
                <span>Catatan Evaluasi / Berita Acara <span className="text-rose-500">*</span>:</span>
                <span className="text-[10px] text-ink-muted font-normal">
                  {varianceStatus !== "BALANCE" && "*Wajib memuat keterangan alasan selisih kas fisik"}
                </span>
              </label>
              <textarea
                rows={3}
                required
                value={evaluationNotes}
                onChange={(e) => setEvaluationNotes(e.target.value)}
                placeholder="Contoh: Kerja sama tim kasir sangat baik. Kas fisik pas sesuai sistem. Pelaporan salah print tertib dan cepat diinput."
                className="w-full px-3 py-2 text-xs rounded-lg border border-subtle focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white placeholder:text-neutral-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-subtle bg-white text-xs font-semibold text-ink hover:bg-neutral-100"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isSubmitting ? "Mengesahkan..." : "Verifikasi & Teruskan ke Audit"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
