"use client";

import React, { useState } from "react";
import { CheckSquare, Users, Banknote, CreditCard, Scale, CheckCircle2, ArrowRight } from "lucide-react";
import { EnrichedShiftItem, VerifyShiftModal } from "@/components/supervisor/VerifyShiftModal";

interface PendingShiftsListProps {
  shifts: EnrichedShiftItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function PendingShiftsList({ shifts, isLoading, onRefresh }: PendingShiftsListProps) {
  const [selectedShift, setSelectedShift] = useState<EnrichedShiftItem | null>(null);

  return (
    <>
      <div className="bg-white rounded-xl border border-subtle shadow-xs overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-subtle px-5 py-3.5 bg-neutral-50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white font-bold text-xs shadow-xs">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-ink">Verifikasi Tutup Shift & Penilaian Siswa</h2>
              <p className="text-[10px] text-ink-muted">
                Shift yang telah ditutup kasir siswa dan menunggu pengesahan akademik ({shifts.length} Shift)
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            shifts.length > 0
              ? "bg-amber-100 text-amber-800 border-amber-300"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}>
            {shifts.length > 0 ? `${shifts.length} Menunggu Verifikasi` : "Semua Selesai"}
          </span>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-xs text-ink-muted">
              Memeriksa daftar shift...
            </div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-12 text-xs text-ink-muted border border-dashed border-subtle rounded-xl bg-neutral-50/50">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <div className="font-bold text-ink">Semua shift telah diverifikasi.</div>
              <p className="text-[11px] text-ink-muted mt-0.5">
                Tidak ada shift kasir yang sedang menunggu evaluasi Guru Pembimbing.
              </p>
            </div>
          ) : (
            shifts.map((shift) => {
              const variance = shift.cash_variance || 0;
              const varianceStatus = shift.variance_status || (variance === 0 ? "BALANCE" : variance < 0 ? "MINUS" : "PLUS");
              const cashSales = shift.summary?.cash_sales || 0;
              const qrisSales = shift.summary?.qris_sales || 0;

              return (
                <div
                  key={shift.id}
                  className="p-4 rounded-xl border border-subtle bg-neutral-50/40 hover:border-amber-300 transition-all shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-ink bg-white px-2 py-0.5 rounded border border-subtle">
                        #{shift.shift_code}
                      </span>
                      <span className="text-[10px] text-ink-muted">
                        Buka: {new Date(shift.opened_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                        {shift.closed_at && ` • Tutup: ${new Date(shift.closed_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`}
                      </span>
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

                    {/* Workers list */}
                    <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                      <Users className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                      <span>
                        Piket: <strong className="text-ink">{shift.student_worker_1}</strong>, {shift.student_worker_2}, {shift.student_worker_3} (Pengawas: <strong>{shift.student_supervisor}</strong>)
                      </span>
                    </div>

                    {/* Financial summary pills */}
                    <div className="flex items-center gap-3 text-[11px] text-ink-muted flex-wrap">
                      <span className="flex items-center gap-1">
                        <Banknote className="w-3 h-3 text-emerald-600" />
                        Tunai: <strong className="font-mono text-ink">Rp {cashSales.toLocaleString("id-ID")}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-blue-600" />
                        QRIS: <strong className="font-mono text-ink">Rp {qrisSales.toLocaleString("id-ID")}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Scale className="w-3 h-3 text-ink-muted" />
                        Fisik Laci: <strong className="font-mono text-ink">Rp {(shift.actual_cash_counted || 0).toLocaleString("id-ID")}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="shrink-0 w-full md:w-auto">
                    <button
                      onClick={() => setSelectedShift(shift)}
                      className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Tinjau & Beri Nilai</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Verifikasi */}
      <VerifyShiftModal
        isOpen={!!selectedShift}
        onClose={() => setSelectedShift(null)}
        shift={selectedShift}
        onVerifiedSuccess={() => {
          setSelectedShift(null);
          onRefresh();
        }}
      />
    </>
  );
}
