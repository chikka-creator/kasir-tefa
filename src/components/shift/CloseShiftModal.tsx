"use client";

import React, { useState } from "react";
import { X, Lock, AlertTriangle, CheckCircle, Scale, DollarSign, AlertCircle } from "lucide-react";
import { useShiftStore } from "@/store/useShiftStore";

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CloseShiftModal({ isOpen, onClose }: CloseShiftModalProps) {
  const { shift, summary, fetchActiveShift } = useShiftStore();
  const [actualCash, setActualCash] = useState<number>(summary?.current_cash_in_drawer ?? 0);
  const [actualQris, setActualQris] = useState<number>(summary?.total_qris_sales ?? 0);
  const [closingNotes, setClosingNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !shift) return null;

  const expectedCash = summary?.current_cash_in_drawer ?? 0;
  const cashVariance = actualCash - expectedCash;

  let varianceBadge = {
    label: "BALANCE (Pas)",
    bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: CheckCircle,
  };

  if (cashVariance < 0) {
    varianceBadge = {
      label: `MINUS (Kurang Rp ${Math.abs(cashVariance).toLocaleString("id-ID")})`,
      bg: "bg-red-50 text-red-800 border-red-200",
      icon: AlertTriangle,
    };
  } else if (cashVariance > 0) {
    varianceBadge = {
      label: `PLUS (Lebih Rp ${cashVariance.toLocaleString("id-ID")})`,
      bg: "bg-amber-50 text-amber-800 border-amber-200",
      icon: AlertTriangle,
    };
  }

  const VarianceIcon = varianceBadge.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsLoading(true);
      const res = await fetch(`/api/shifts/${shift.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actual_cash_counted: actualCash,
          actual_qris_counted: actualQris,
          closing_notes: closingNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menutup shift.");
      }

      await fetchActiveShift();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menutup shift.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-xl border border-subtle bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-subtle px-4 sm:px-5 py-3 sm:py-4 bg-neutral-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white font-bold shadow-sm shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-ink">Tutup Shift & Rekonsiliasi Kas</h2>
              <p className="text-[10px] sm:text-[11px] text-ink-muted">
                Shift: <span className="font-mono font-bold text-ink">#{shift.shift_code}</span> (Laci Gabungan POS 1 & POS 2)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-ink-muted hover:bg-neutral-200 hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Rincian Komparasi Sistem */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg border border-subtle bg-neutral-50 text-xs">
            <div>
              <span className="text-[11px] text-ink-muted block">Modal Awal Laci:</span>
              <span className="font-mono font-bold text-ink tabular-nums text-sm">
                Rp {summary?.opening_cash.toLocaleString("id-ID") ?? 0}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-ink-muted block">Penjualan Tunai Sistem:</span>
              <span className="font-mono font-bold text-emerald-700 tabular-nums text-sm">
                + Rp {summary?.total_cash_sales.toLocaleString("id-ID") ?? 0}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-ink-muted block">Penjualan QRIS Sistem:</span>
              <span className="font-mono font-semibold text-blue-700 tabular-nums">
                Rp {summary?.total_qris_sales.toLocaleString("id-ID") ?? 0}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-ink-muted block">Total Transaksi Selesai:</span>
              <span className="font-mono font-semibold text-ink">
                {summary?.total_transactions_count ?? 0} Struk
              </span>
            </div>
            <div className="col-span-2 pt-2 border-t border-subtle flex items-center justify-between">
              <span className="font-bold text-ink">Uang Kas Seharusnya di Laci (Sistem):</span>
              <span className="font-mono font-bold text-ink text-base tabular-nums">
                Rp {expectedCash.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Input Uang Fisik Aktual */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Hitungan Uang Tunai Fisik di Laci (Dihitung Manual):
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-ink-muted">
                  Rp
                </div>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={actualCash}
                  onChange={(e) => setActualCash(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 text-sm font-mono font-bold text-ink rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
                />
              </div>
            </div>

            {/* Status Selisih Kas Live */}
            <div className={`flex items-center justify-between p-3 rounded-lg border ${varianceBadge.bg}`}>
              <div className="flex items-center gap-2">
                <VarianceIcon className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold">Status Selisih Kas:</span>
              </div>
              <span className="text-xs font-mono font-bold tabular-nums">
                {varianceBadge.label}
              </span>
            </div>

            {/* Catatan / Berita Acara */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Catatan Penutupan Shift {cashVariance !== 0 && <span className="text-red-600 font-bold">(Wajib Diisi Bila Terjadi Selisih)</span>}:
              </label>
              <textarea
                rows={2}
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Tuliskan keterangan mengenai operasional shift atau alasan selisih jika ada..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-neutral-400"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg border border-subtle text-xs font-semibold text-ink hover:bg-neutral-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isLoading ? "Menutup Shift..." : "Konfirmasi & Tutup Shift"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
