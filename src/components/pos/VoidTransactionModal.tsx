"use client";

import React, { useState } from "react";
import { X, ShieldAlert, KeyRound, Send, AlertTriangle, CheckCircle2 } from "lucide-react";
import { TransactionRecord } from "@/lib/shifts-data";
import { usePosTerminalStore } from "@/store/usePosTerminalStore";

interface VoidTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionRecord | null;
  onVoidSuccess: () => void;
}

export function VoidTransactionModal({
  isOpen,
  onClose,
  transaction,
  onVoidSuccess,
}: VoidTransactionModalProps) {
  const { terminalId } = usePosTerminalStore();
  const [activeTab, setActiveTab] = useState<"PIN" | "REMOTE">("PIN");

  // Form states
  const [reason, setReason] = useState("");
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen || !transaction) return null;

  const handleReset = () => {
    setReason("");
    setPin("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmitPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!reason || reason.trim().length < 5) {
      setErrorMessage("Alasan pembatalan transaksi wajib diisi minimal 5 karakter.");
      return;
    }

    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setErrorMessage("PIN Supervisor wajib berupa 6 digit angka.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/transactions/${transaction.id}/void-with-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin,
          reason,
          device_terminal: terminalId,
          shift_id: transaction.shift_id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membatalkan transaksi.");
      }

      setSuccessMessage("Transaksi berhasil dibatalkan menggunakan PIN Supervisor!");
      setTimeout(() => {
        handleClose();
        onVoidSuccess();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses void.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRemote = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!reason || reason.trim().length < 5) {
      setErrorMessage("Alasan pengajuan pembatalan wajib diisi minimal 5 karakter.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/transactions/${transaction.id}/void-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          device_terminal: terminalId,
          shift_id: transaction.shift_id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim pengajuan void.");
      }

      setSuccessMessage("Pengajuan void berhasil dikirim ke Dashboard Guru Pembimbing!");
      setTimeout(() => {
        handleClose();
        onVoidSuccess();
      }, 1400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-xl border border-subtle bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-subtle px-4 sm:px-5 py-3 sm:py-3.5 bg-rose-50/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600 text-white font-bold text-xs shadow-sm shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-rose-950">Otorisasi Pembatalan Transaksi (Void)</h2>
              <p className="text-[10px] text-rose-700">
                Faktur: <span className="font-mono font-bold">{transaction.invoice_number}</span> (Rp {transaction.total_amount.toLocaleString("id-ID")})
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-md p-1.5 text-neutral-400 hover:bg-rose-100 hover:text-rose-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector: Dual Mode */}
        <div className="flex border-b border-subtle bg-neutral-50 p-1.5 gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("PIN");
              setErrorMessage("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
              activeTab === "PIN"
                ? "bg-white text-slate-900 shadow-xs border border-subtle"
                : "text-ink-muted hover:text-ink hover:bg-neutral-100"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>Mode 1: PIN Guru di Tempat</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("REMOTE");
              setErrorMessage("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
              activeTab === "REMOTE"
                ? "bg-white text-slate-900 shadow-xs border border-subtle"
                : "text-ink-muted hover:text-ink hover:bg-neutral-100"
            }`}
          >
            <Send className="w-3.5 h-3.5 text-sky-600" />
            <span>Mode 2: Request Jarak Jauh</span>
          </button>
        </div>

        {/* Error / Success Feedback */}
        {errorMessage && (
          <div className="m-4 mb-0 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="m-4 mb-0 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Summary Box */}
          <div className="p-3 rounded-lg border border-subtle bg-neutral-50/70 text-xs space-y-1.5">
            <div className="flex justify-between text-ink-muted text-[11px]">
              <span>Rincian Item yang Dibatalkan:</span>
              <span className="font-semibold text-ink">{transaction.items.length} Macam</span>
            </div>
            <div className="text-ink font-medium text-[11px] leading-relaxed">
              {transaction.items.map((i) => `${i.product_name_snapshot} (${i.qty})`).join(", ")}
            </div>
            <div className="pt-1 border-t border-subtle flex justify-between font-bold text-xs text-ink">
              <span>Total Pengembalian:</span>
              <span className="font-mono text-rose-700">Rp {transaction.total_amount.toLocaleString("id-ID")}</span>
            </div>
          </div>

          {activeTab === "PIN" ? (
            /* Mode 1: PIN di Tempat Form */
            <form onSubmit={handleSubmitPin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Alasan Pembatalan Transaksi <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: Pelanggan salah memilih kertas foto glossy / transaksi dobel kasir"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-subtle focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-neutral-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Masukkan 6-Digit PIN Supervisor Guru <span className="text-rose-500">*</span>:
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-amber-600" />
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm tracking-widest font-mono text-center rounded-lg border border-subtle focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <p className="text-[10px] text-ink-muted mt-1">
                  *Guru Pembimbing memasukkan PIN Supervisor langsung di layar kasir. (PIN Bawaan: <code className="font-mono font-bold">123456</code>)
                </p>
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
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? "Memverifikasi..." : "Otorisasi & Batalkan Transaksi"}
                </button>
              </div>
            </form>
          ) : (
            /* Mode 2: Request Jarak Jauh Form */
            <form onSubmit={handleSubmitRemote} className="space-y-3.5">
              <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-sky-600" />
                  <span>Pengajuan Void Jarak Jauh:</span>
                </div>
                <p className="text-[11px] text-sky-800 leading-relaxed">
                  Gunakan opsi ini jika Guru Pembimbing sedang berada di ruang kantor/lab. Pengajuan akan muncul di <strong>Dashboard Guru</strong> untuk disetujui. Kasir dapat lanjut melayani antrean lain.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Alasan Detail Pembatalan <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Jelaskan alasan kenapa transaksi ini harus dibatalkan agar Guru dapat meninjau..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-subtle focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-neutral-400"
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
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Mengirim Pengajuan..." : "Kirim Pengajuan ke Guru"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
