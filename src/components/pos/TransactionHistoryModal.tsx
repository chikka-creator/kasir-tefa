"use client";

import React, { useEffect, useState } from "react";
import { X, History, Printer, Search, RefreshCw, CreditCard, Banknote, Ban, Clock } from "lucide-react";
import { TransactionRecord } from "@/lib/shifts-data";
import { useShiftStore } from "@/store/useShiftStore";
import { ReceiptModal } from "@/components/pos/ReceiptModal";
import { VoidTransactionModal } from "@/components/pos/VoidTransactionModal";

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionHistoryModal({
  isOpen,
  onClose,
}: TransactionHistoryModalProps) {
  const { shift } = useShiftStore();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<TransactionRecord | null>(null);
  const [selectedTxForVoid, setSelectedTxForVoid] = useState<TransactionRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const url = shift?.id ? `/api/transactions?shift_id=${shift.id}` : `/api/transactions`;
      const res = await fetch(url);
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error("fetchTransactions error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
    }
  }, [isOpen, shift?.id]);

  if (!isOpen) return null;

  const filtered = transactions.filter((t) =>
    t.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.items.some((i) => i.product_name_snapshot.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="w-full max-w-3xl rounded-xl border border-subtle bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-subtle px-5 py-3.5 bg-neutral-50">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs shadow-sm">
                <History className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-ink">
                  {shift ? "Riwayat Struk Penjualan Shift Ini" : "Riwayat Transaksi Penjualan Terakhir"}
                </h2>
                <p className="text-[10px] text-ink-muted">
                  {shift ? (
                    <>Shift: <span className="font-mono font-bold">#{shift.shift_code}</span> ({transactions.length} Transaksi)</>
                  ) : (
                    <>{transactions.length} Transaksi Terakhir (Shift tidak aktif)</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchTransactions}
                disabled={isLoading}
                className="p-1.5 rounded-md border border-subtle bg-white hover:bg-neutral-100 text-ink-muted hover:text-ink transition-colors"
                title="Muat ulang riwayat"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-ink-muted hover:bg-neutral-200 hover:text-ink transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-subtle bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-ink-muted" />
              <input
                type="text"
                placeholder="Cari nomor struk atau nama item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-subtle bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {isLoading ? (
              <div className="text-center py-10 text-xs text-ink-muted">
                Memuat riwayat transaksi...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-xs text-ink-muted border border-dashed border-subtle rounded-lg">
                Belum ada transaksi pada shift ini.
              </div>
            ) : (
              filtered.map((t) => {
                const isVoided = t.status === "VOIDED";
                const isVoidRequested = t.status === "VOID_REQUESTED";

                return (
                  <div
                    key={t.id}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl border transition-colors shadow-xs gap-2.5 ${
                      isVoided
                        ? "bg-rose-50/50 border-rose-200"
                        : isVoidRequested
                        ? "bg-amber-50/50 border-amber-200"
                        : "bg-white border-subtle hover:border-slate-300"
                    }`}
                  >
                    <div className="space-y-1 w-full sm:w-auto">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`font-mono font-bold text-xs ${isVoided ? "line-through text-rose-800" : "text-ink"}`}>
                          {t.invoice_number}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-neutral-100 border border-subtle text-ink-muted">
                          {t.device_terminal}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded flex items-center gap-1 ${
                          t.payment_method === "CASH"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {t.payment_method === "CASH" ? <Banknote className="w-2.5 h-2.5" /> : <CreditCard className="w-2.5 h-2.5" />}
                          {t.payment_method}
                        </span>

                        {/* Status Badge */}
                        {isVoided && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                            <Ban className="w-2.5 h-2.5" />
                            Dibatalkan (VOID)
                          </span>
                        )}
                        {isVoidRequested && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 animate-pulse flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            Menunggu Approval Guru
                          </span>
                        )}
                      </div>

                      <div className={`text-[11px] ${isVoided ? "line-through text-neutral-400" : "text-ink-muted"}`}>
                        {t.items.map((i) => `${i.product_name_snapshot} (${i.qty})`).join(", ")}
                      </div>

                      <div className="text-[10px] text-neutral-400 flex items-center gap-2">
                        <span>{new Date(t.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</span>
                        {t.void_reason && (
                          <span className="text-rose-700 italic">
                            • Alasan: &quot;{t.void_reason}&quot;
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-subtle">
                      <div className="text-right">
                        <div className={`text-xs font-bold font-mono tabular-nums ${
                          isVoided ? "line-through text-neutral-400" : "text-ink"
                        }`}>
                          Rp {t.total_amount.toLocaleString("id-ID")}
                        </div>
                        <div className={`text-[10px] font-semibold ${
                          isVoided ? "text-rose-600" : isVoidRequested ? "text-amber-700" : "text-emerald-700"
                        }`}>
                          {isVoided ? "Batal" : isVoidRequested ? "Review Void" : "Lunas"}
                        </div>
                      </div>

                      {/* Tombol Reprint */}
                      <button
                        onClick={() => setSelectedTxForReceipt(t)}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-subtle bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 text-xs font-semibold text-ink transition-colors shadow-xs"
                        title="Cetak Ulang Struk"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Reprint</span>
                      </button>

                      {/* Tombol Batalkan (Void) - Hanya jika status PAID */}
                      {t.status === "PAID" && (
                        <button
                          onClick={() => setSelectedTxForVoid(t)}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white hover:border-rose-600 text-xs font-semibold transition-colors shadow-xs"
                          title="Batalkan Transaksi (Dual-Mode Void)"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Void</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal Cetak Ulang Struk */}
      <ReceiptModal
        isOpen={!!selectedTxForReceipt}
        onClose={() => setSelectedTxForReceipt(null)}
        transaction={selectedTxForReceipt}
        shiftInfo={shift}
      />

      {/* Modal Otorisasi Pembatalan (Void) */}
      <VoidTransactionModal
        isOpen={!!selectedTxForVoid}
        onClose={() => setSelectedTxForVoid(null)}
        transaction={selectedTxForVoid}
        onVoidSuccess={() => {
          fetchTransactions();
        }}
      />
    </>
  );
}
