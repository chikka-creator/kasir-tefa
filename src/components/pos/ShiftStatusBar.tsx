"use client";

import React, { useEffect, useState } from "react";
import { PlusCircle, Lock, History, AlertCircle, RefreshCw } from "lucide-react";
import { useShiftStore } from "@/store/useShiftStore";
import { OpenShiftModal } from "@/components/shift/OpenShiftModal";
import { CloseShiftModal } from "@/components/shift/CloseShiftModal";
import { TransactionHistoryModal } from "@/components/pos/TransactionHistoryModal";

export function ShiftStatusBar() {
  const { active, shift, summary, isLoading, fetchActiveShift } = useShiftStore();
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    fetchActiveShift();
    // Polling sinkronisasi shift setiap 8 detik agar POS 1 & POS 2 selalu selaras
    const interval = setInterval(() => {
      fetchActiveShift();
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl border border-subtle bg-white shadow-xs">
        {active && shift ? (
          /* Shift Aktif */
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <span className="flex h-2.5 w-2.5 relative shrink-0 mt-1 sm:mt-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="text-xs flex-1">
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 font-semibold text-ink">
                <span className="text-emerald-700 font-bold">Shift Aktif</span>
                <span className="font-mono text-ink bg-neutral-100 px-1.5 py-0.2 rounded border border-subtle">
                  #{shift.shift_code}
                </span>
                <span className="text-neutral-300 hidden sm:inline">|</span>
                <span className="text-ink-muted font-normal text-[11px] sm:text-xs">
                  Tim: <strong className="text-ink font-semibold">{shift.student_worker_1}, {shift.student_worker_2}, {shift.student_worker_3}</strong>
                </span>
                <span className="text-neutral-300 hidden sm:inline">|</span>
                <span className="text-ink-muted font-normal text-[11px] sm:text-xs">
                  Pengawas: <strong className="text-ink font-semibold">{shift.student_supervisor}</strong>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] sm:text-[11px] text-ink-muted mt-1">
                <span>
                  Laci Kas: <strong className="text-emerald-700 font-mono font-bold tabular-nums">Rp {(summary?.current_cash_in_drawer ?? 0).toLocaleString("id-ID")}</strong>
                </span>
                <span>•</span>
                <span>
                  QRIS: <strong className="text-blue-700 font-mono font-semibold tabular-nums">Rp {(summary?.total_qris_sales ?? 0).toLocaleString("id-ID")}</strong>
                </span>
                <span>•</span>
                <span>{summary?.total_transactions_count ?? 0} Transaksi</span>
              </div>
            </div>
          </div>
        ) : (
          /* Belum Ada Shift */
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900">
                Belum Ada Sesi Shift Kasir Aktif
              </div>
              <div className="text-[11px] text-ink-muted">
                Buka shift kasir terlebih dahulu untuk mencatat modal laci dan siswa yang bertugas.
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-subtle">
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-subtle bg-white hover:bg-neutral-50 text-xs font-semibold text-ink transition-colors shadow-xs"
            title="Lihat riwayat struk penjualan & cetak ulang"
          >
            <History className="w-3.5 h-3.5 text-ink-muted" />
            <span>Riwayat & Reprint</span>
          </button>

          {active ? (
            <button
              onClick={() => setIsCloseShiftModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors"
              title="Tutup shift dan hitung selisih uang fisik laci"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Tutup Shift</span>
            </button>
          ) : (
            <button
              onClick={() => setIsOpenShiftModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buka Shift Kasir</span>
            </button>
          )}

          <button
            onClick={() => fetchActiveShift()}
            className="p-1.5 rounded-lg border border-subtle bg-white hover:bg-neutral-100 text-ink-muted hover:text-ink transition-colors shrink-0"
            title="Muat ulang status shift"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modals */}
      <OpenShiftModal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
      />

      <CloseShiftModal
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
      />

      <TransactionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </>
  );
}
