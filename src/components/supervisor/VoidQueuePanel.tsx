"use client";

import React, { useState } from "react";
import { ShieldAlert, Check, X, Clock, Banknote, CreditCard, AlertCircle } from "lucide-react";

export interface PendingVoidItem {
  id: string;
  invoice_number: string;
  shift_id: string;
  device_terminal: string;
  subtotal: number;
  total_amount: number;
  payment_method: "CASH" | "QRIS";
  status: string;
  void_reason: string | null;
  created_at: string;
  items: Array<{
    product_name: string;
    qty: number;
    subtotal: number;
  }>;
}

interface VoidQueuePanelProps {
  voidQueue: PendingVoidItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function VoidQueuePanel({ voidQueue, isLoading, onRefresh }: VoidQueuePanelProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<string>("");
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleApprove = async (id: string, invoice: string) => {
    try {
      setProcessingId(id);
      setFeedbackMessage(null);

      const res = await fetch(`/api/transactions/${id}/void-approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyetujui void.");

      setFeedbackMessage({
        type: "success",
        text: `Void faktur #${invoice} berhasil disetujui! Stok barang fisik telah dikembalikan.`,
      });
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setFeedbackMessage({ type: "error", text: msg });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, invoice: string) => {
    try {
      setProcessingId(id);
      setFeedbackMessage(null);

      const res = await fetch(`/api/transactions/${id}/void-approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT", teacher_notes: rejectNotes || "Ditolak oleh Guru Pembimbing" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menolak void.");

      setFeedbackMessage({
        type: "success",
        text: `Pengajuan void faktur #${invoice} ditolak. Status dikembalikan ke LUNAS.`,
      });
      setRejectingId(null);
      setRejectNotes("");
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setFeedbackMessage({ type: "error", text: msg });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-subtle shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-subtle px-5 py-3.5 bg-neutral-50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white font-bold text-xs shadow-xs">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-ink">Antrean Pengajuan Void Kasir Jarak Jauh</h2>
            <p className="text-[10px] text-ink-muted">
              Persetujuan pembatalan transaksi dari layar kasir siswa ({voidQueue.length} Antrean)
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          voidQueue.length > 0
            ? "bg-amber-100 text-amber-800 border-amber-300 animate-pulse"
            : "bg-emerald-50 text-emerald-700 border-emerald-200"
        }`}>
          {voidQueue.length > 0 ? `${voidQueue.length} Menunggu Persetujuan` : "Semua Bersih"}
        </span>
      </div>

      {/* Feedback Message */}
      {feedbackMessage && (
        <div className={`p-3 m-4 mb-0 rounded-lg text-xs flex items-center justify-between ${
          feedbackMessage.type === "success"
            ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
            : "bg-rose-50 border border-rose-200 text-rose-800"
        }`}>
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-neutral-400 hover:text-ink">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* List */}
      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-xs text-ink-muted">
            Memeriksa antrean pengajuan void...
          </div>
        ) : voidQueue.length === 0 ? (
          <div className="text-center py-12 text-xs text-ink-muted border border-dashed border-subtle rounded-xl bg-neutral-50/50">
            <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <div className="font-bold text-ink">Tidak ada antrean pembatalan transaksi.</div>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Semua transaksi kasir siswa berjalan normal tanpa pengajuan void pending.
            </p>
          </div>
        ) : (
          voidQueue.map((item) => {
            const isBeingProcessed = processingId === item.id;
            const isRejectMode = rejectingId === item.id;

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 hover:border-amber-300 transition-all shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-ink">
                      {item.invoice_number}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-neutral-100 border border-subtle text-ink-muted">
                      {item.device_terminal}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded flex items-center gap-1 ${
                      item.payment_method === "CASH"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {item.payment_method === "CASH" ? <Banknote className="w-2.5 h-2.5" /> : <CreditCard className="w-2.5 h-2.5" />}
                      {item.payment_method}
                    </span>
                    <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(item.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                    </span>
                  </div>

                  <div className="text-xs font-bold font-mono text-rose-700 tabular-nums">
                    Total: Rp {item.total_amount.toLocaleString("id-ID")}
                  </div>
                </div>

                {/* Items detail */}
                <div className="text-xs text-ink-muted">
                  <span className="font-semibold text-ink">Item Struk: </span>
                  {item.items.map((i) => `${i.product_name} (${i.qty}x)`).join(", ")}
                </div>

                {/* Alasan Pembatalan */}
                <div className="p-2.5 rounded-lg bg-white border border-amber-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-950">Alasan Kasir: </span>
                    <span className="text-ink italic">&quot;{item.void_reason || "Tidak ada alasan spesifik"}&quot;</span>
                  </div>
                </div>

                {/* Reject Input Box if open */}
                {isRejectMode && (
                  <div className="p-3 rounded-lg bg-neutral-50 border border-subtle space-y-2">
                    <label className="block text-[11px] font-semibold text-ink">
                      Alasan Penolakan Pengajuan Void (Opsional):
                    </label>
                    <input
                      type="text"
                      value={rejectNotes}
                      onChange={(e) => setRejectNotes(e.target.value)}
                      placeholder="Contoh: Transaksi valid, barang sudah dicetak"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-subtle focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingId(null);
                          setRejectNotes("");
                        }}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold text-ink-muted hover:bg-neutral-200"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={isBeingProcessed}
                        onClick={() => handleReject(item.id, item.invoice_number)}
                        className="px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                      >
                        {isBeingProcessed ? "Memproses..." : "Konfirmasi Tolak Void"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {!isRejectMode && (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isBeingProcessed}
                      onClick={() => setRejectingId(item.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Tolak</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBeingProcessed}
                      onClick={() => handleApprove(item.id, item.invoice_number)}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isBeingProcessed ? "Memproses..." : "Setujui Void & Kembalikan Stok"}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
