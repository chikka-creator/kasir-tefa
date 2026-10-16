"use client";

import React, { useState } from "react";
import { X, KeyRound, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePinModal({ isOpen, onClose }: ChangePinModalProps) {
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  const handleReset = () => {
    setOldPin("");
    setNewPin("");
    setConfirmPin("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (oldPin.length !== 6 || !/^\d{6}$/.test(oldPin)) {
      setErrorMessage("PIN lama harus terdiri dari 6 digit angka numerik.");
      return;
    }

    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setErrorMessage("PIN baru harus terdiri dari 6 digit angka numerik.");
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMessage("Konfirmasi PIN baru tidak sesuai.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/supervisor/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_pin: oldPin, new_pin: newPin }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui PIN.");
      }

      setSuccessMessage("PIN 6-digit Supervisor berhasil diubah!");
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-xl border border-subtle bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-subtle px-4 sm:px-5 py-3 sm:py-3.5 bg-neutral-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white font-bold text-xs shadow-xs shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-ink">Ubah PIN Supervisor Guru</h2>
              <p className="text-[10px] text-ink-muted">
                Untuk otorisasi cepat pembatalan transaksi di meja kasir
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
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

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              PIN Lama (6 Digit) <span className="text-rose-500">*</span>:
            </label>
            <input
              type="password"
              maxLength={6}
              required
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))}
              placeholder="•••••• (Default: 123456)"
              className="w-full px-3 py-2 text-center text-sm tracking-widest font-mono rounded-lg border border-subtle focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              PIN Baru (6 Digit Angka) <span className="text-rose-500">*</span>:
            </label>
            <input
              type="password"
              maxLength={6}
              required
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              className="w-full px-3 py-2 text-center text-sm tracking-widest font-mono rounded-lg border border-subtle focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Konfirmasi PIN Baru <span className="text-rose-500">*</span>:
            </label>
            <input
              type="password"
              maxLength={6}
              required
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              className="w-full px-3 py-2 text-center text-sm tracking-widest font-mono rounded-lg border border-subtle focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-subtle">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-subtle text-xs font-semibold text-ink hover:bg-neutral-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isSubmitting ? "Menyimpan..." : "Simpan PIN Baru"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
