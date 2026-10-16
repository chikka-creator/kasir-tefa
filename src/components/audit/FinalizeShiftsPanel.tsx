"use client";

import React, { useState } from "react";
import {
  Lock,
  CheckCircle2,
  Users,
  Award,
  Scale,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { ShiftRecord } from "@/lib/shifts-data";

interface FinalizeShiftsPanelProps {
  verifiedShifts: ShiftRecord[];
  auditedShifts: ShiftRecord[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function FinalizeShiftsPanel({
  verifiedShifts,
  auditedShifts,
  isLoading,
  onRefresh,
}: FinalizeShiftsPanelProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleFinalize = async (shiftId: string, shiftCode: string) => {
    try {
      setProcessingId(shiftId);
      setFeedback(null);

      const res = await fetch(`/api/shifts/${shiftId}/audit-close`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memfinalisasi audit shift.");
      }

      setFeedback({
        type: "success",
        text: `Shift #${shiftCode} berhasil difinalisasi dan dikunci permanen (CLOSED_AUDITED).`,
      });
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setFeedback({ type: "error", text: msg });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedback && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
          feedback.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-rose-50 border border-rose-200 text-rose-800"
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-neutral-400 hover:text-ink">
            &times;
          </button>
        </div>
      )}

      {/* Bagian 1: Shift Menunggu Finalisasi Tutup Buku */}
      <div className="bg-white rounded-xl border border-subtle shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-subtle px-5 py-3.5 bg-neutral-50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white font-bold text-xs shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-ink">Shift Menunggu Finalisasi Tutup Buku</h2>
              <p className="text-[10px] text-ink-muted">
                Telah diverifikasi dan dinilai oleh Guru Pembimbing ({verifiedShifts.length} Shift)
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
            verifiedShifts.length > 0
              ? "bg-amber-100 text-amber-800 border-amber-300"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}>
            {verifiedShifts.length > 0 ? `${verifiedShifts.length} Siap Ditutup Buku` : "Semua Beres"}
          </span>
        </div>

        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-xs text-ink-muted">Memeriksa daftar shift...</div>
          ) : verifiedShifts.length === 0 ? (
            <div className="text-center py-10 text-xs text-ink-muted border border-dashed border-subtle rounded-xl bg-neutral-50/50">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <div className="font-bold text-ink">Tidak ada shift yang menunggu finalisasi audit.</div>
              <p className="text-[11px] text-ink-muted mt-0.5">
                Semua shift yang diverifikasi guru telah dikunci dan disahkan ke pembukuan resmi.
              </p>
            </div>
          ) : (
            verifiedShifts.map((shift) => {
              const isProcessing = processingId === shift.id;
              const variance = shift.cash_variance || 0;
              const varianceStatus = shift.variance_status || (variance === 0 ? "BALANCE" : variance < 0 ? "MINUS" : "PLUS");

              return (
                <div
                  key={shift.id}
                  className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 hover:border-amber-300 transition-all shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-ink bg-white px-2 py-0.5 rounded border border-subtle">
                        #{shift.shift_code}
                      </span>
                      <span className="text-[10px] text-ink-muted flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(shift.opened_at).toLocaleDateString("id-ID")} • Sesi Selesai
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        varianceStatus === "BALANCE"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-rose-100 text-rose-800 border-rose-300"
                      }`}>
                        Kas {varianceStatus === "BALANCE" ? "Pas (Balance)" : `Selisih (Rp ${variance.toLocaleString("id-ID")})`}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                        <Award className="w-3 h-3 text-blue-600" />
                        Nilai Guru: {shift.teacher_score ?? "-"}/100
                      </span>
                    </div>

                    {/* Workers */}
                    <div className="text-xs text-ink-muted flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                      <span>
                        Piket Siswa: <strong className="text-ink">{shift.student_worker_1}</strong>, {shift.student_worker_2}, {shift.student_worker_3} (Pengawas: <strong>{shift.student_supervisor}</strong>)
                      </span>
                    </div>

                    {/* Teacher Notes */}
                    {shift.teacher_evaluation_notes && (
                      <div className="p-2.5 rounded-lg bg-white border border-amber-200/80 text-[11px] text-ink-muted">
                        <strong className="text-ink">Berita Acara Guru: </strong>
                        <span className="italic">&quot;{shift.teacher_evaluation_notes}&quot;</span>
                      </div>
                    )}
                  </div>

                  {/* Action button */}
                  <div className="shrink-0 w-full lg:w-auto">
                    <button
                      onClick={() => handleFinalize(shift.id, shift.shift_code)}
                      disabled={isProcessing}
                      className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isProcessing ? "Mengesahkan..." : "Finalisasi & Kunci Laporan (Audit Close)"}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bagian 2: Riwayat Shift Selesai & Terkunci Permanen (CLOSED_AUDITED) */}
      <div className="bg-white rounded-xl border border-subtle shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-subtle px-5 py-3.5 bg-neutral-50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-white font-bold text-xs shadow-xs">
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-ink">Riwayat Shift Selesai & Terkunci Permanen</h2>
              <p className="text-[10px] text-ink-muted">
                Shift yang telah diaudit dan disahkan ke pembukuan resmi sekolah ({auditedShifts.length} Shift)
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-ink-muted border border-subtle">
            Buku Terkunci (Immutable)
          </span>
        </div>

        <div className="divide-y divide-subtle">
          {auditedShifts.length === 0 ? (
            <div className="text-center py-8 text-xs text-ink-muted">
              Belum ada shift yang telah difinalisasi audit.
            </div>
          ) : (
            auditedShifts.map((s) => (
              <div key={s.id} className="p-4 hover:bg-neutral-50/50 transition-colors flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-ink">#{s.shift_code}</span>
                    <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.2 rounded-full flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-emerald-600" />
                      CLOSED_AUDITED
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Nilai Tim: <strong className="text-ink">{s.teacher_score ?? "-"}/100</strong>
                    </span>
                  </div>
                  <div className="text-[11px] text-ink-muted">
                    Petugas: {s.student_worker_1}, {s.student_worker_2}, {s.student_worker_3} (Pengawas: {s.student_supervisor})
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-ink">
                    Fisik: Rp {(s.actual_cash_counted || 0).toLocaleString("id-ID")}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium">Disahkan Audit</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
