"use client";

import React, { useState } from "react";
import { X, Users, DollarSign, Sparkles, AlertCircle } from "lucide-react";
import { useShiftStore } from "@/store/useShiftStore";

interface OpenShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OpenShiftModal({ isOpen, onClose }: OpenShiftModalProps) {
  const { fetchActiveShift } = useShiftStore();
  const [worker1, setWorker1] = useState("");
  const [worker2, setWorker2] = useState("");
  const [worker3, setWorker3] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [openingCash, setOpeningCash] = useState<number>(100000);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const fillDemoData = () => {
    setWorker1("Andi Pratama");
    setWorker2("Budi Santoso");
    setWorker3("Citra Dewi");
    setSupervisor("Dedi Gunawan (Ketua Shift)");
    setOpeningCash(100000);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!worker1.trim() || !worker2.trim() || !worker3.trim() || !supervisor.trim()) {
      setError("Nama ketiga siswa bertugas dan siswa pengawas wajib diisi.");
      return;
    }

    if (openingCash < 0) {
      setError("Nominal modal awal kas laci tidak boleh negatif.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/shifts/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_worker_1: worker1.trim(),
          student_worker_2: worker2.trim(),
          student_worker_3: worker3.trim(),
          student_supervisor: supervisor.trim(),
          opening_cash: openingCash,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuka shift kasir.");
      }

      await fetchActiveShift();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat membuka shift.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-xl border border-subtle bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-subtle px-4 sm:px-5 py-3 sm:py-4 bg-neutral-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold shadow-sm shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-ink">Buka Sesi Shift Kasir Bersama</h2>
              <p className="text-[10px] sm:text-[11px] text-ink-muted">
                1 Laci Uang Fisik digunakan bersama oleh POS 1 & 2
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

          {/* Quick Demo Fill */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
            <span className="text-[11px] font-medium text-emerald-900">
              Ingin uji coba cepat untuk 4 siswa piket?
            </span>
            <button
              type="button"
              onClick={fillDemoData}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200 shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Isi Data Demo</span>
            </button>
          </div>

          {/* Tim Bertugas (3 Siswa) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-ink">
              3 Siswa Bertugas Piket (Wajib):
            </label>
            <div className="grid grid-cols-1 gap-2">
              <input
                type="text"
                required
                value={worker1}
                onChange={(e) => setWorker1(e.target.value)}
                placeholder="Nama Siswa Bertugas 1 (misal: Andi Pratama)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <input
                type="text"
                required
                value={worker2}
                onChange={(e) => setWorker2(e.target.value)}
                placeholder="Nama Siswa Bertugas 2 (misal: Budi Santoso)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <input
                type="text"
                required
                value={worker3}
                onChange={(e) => setWorker3(e.target.value)}
                placeholder="Nama Siswa Bertugas 3 (misal: Citra Dewi)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* 1 Siswa Pengawas */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              1 Siswa Pengawas / Ketua Shift (Wajib):
            </label>
            <input
              type="text"
              required
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
              placeholder="Nama Siswa Pengawas (misal: Dedi Gunawan)"
              className="w-full px-3 py-2 text-xs rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Modal Awal Laci */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Modal Awal Uang Fisik di Laci Kas:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-ink-muted">
                Rp
              </div>
              <input
                type="number"
                min="0"
                step="1000"
                required
                value={openingCash}
                onChange={(e) => setOpeningCash(Number(e.target.value))}
                placeholder="100000"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold text-ink rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
              />
            </div>
            <p className="text-[10px] text-ink-muted mt-1">
              Uang pecahan kecil untuk modal kembalian awal di laci fisik bersama.
            </p>
          </div>

          {/* Footer Buttons */}
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>{isLoading ? "Membuka Shift..." : "Konfirmasi Buka Shift"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
