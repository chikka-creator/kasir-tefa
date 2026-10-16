"use client";

import React, { useEffect, useState } from "react";
import {
  History,
  Printer,
  Search,
  RefreshCw,
  Ban,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  Filter,
} from "lucide-react";
import { PosSubNav } from "@/components/pos/PosSubNav";
import { TransactionRecord } from "@/lib/shifts-data";
import { useShiftStore } from "@/store/useShiftStore";
import { ReceiptModal } from "@/components/pos/ReceiptModal";
import { VoidTransactionModal } from "@/components/pos/VoidTransactionModal";

export default function RiwayatTransaksiPage() {
  const { shift } = useShiftStore();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<TransactionRecord | null>(null);
  const [selectedTxForVoid, setSelectedTxForVoid] = useState<TransactionRecord | null>(null);

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
    fetchTransactions();
  }, [shift?.id]);

  const filteredTransactions = transactions.filter((t) => {
    const matchSearch =
      t.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.items.some((i) => i.product_name_snapshot.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchPayment = paymentFilter === "ALL" || t.payment_method === paymentFilter;
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;

    return matchSearch && matchPayment && matchStatus;
  });

  const totalOmzet = transactions
    .filter((t) => t.status === "PAID")
    .reduce((sum, t) => sum + t.total_amount, 0);

  const cashCount = transactions.filter((t) => t.payment_method === "CASH" && t.status === "PAID").length;
  const qrisCount = transactions.filter((t) => t.payment_method === "QRIS" && t.status === "PAID").length;
  const voidCount = transactions.filter((t) => t.status === "VOIDED").length;

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 max-w-7xl w-full mx-auto space-y-4">
      {/* 1. Sub-Navigasi POS */}
      <PosSubNav />

      {/* 2. Banner Header & Statistik */}
      <div className="bg-white rounded-xl border border-subtle p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <History className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-bold text-ink">Riwayat Struk & Transaksi Penjualan</h1>
              {shift ? (
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  Shift #{shift.shift_code}
                </span>
              ) : (
                <span className="text-[10px] font-semibold bg-neutral-100 text-ink-muted px-2 py-0.5 rounded-full border border-subtle">
                  Semua Riwayat Terakhir
                </span>
              )}
            </div>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Lihat seluruh struk penjualan kasir, cetak ulang struk thermal (*reprint*), atau ajukan pembatalan (*void*).
            </p>
          </div>
        </div>

        {/* Ringkasan Omzet */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-neutral-50 border border-subtle text-xs shrink-0 flex-wrap">
          <div>
            <div className="text-[10px] text-ink-muted">Total Transaksi:</div>
            <div className="font-mono font-bold text-ink">
              {transactions.length} <span className="text-[10px] font-normal text-ink-muted">struk</span>
            </div>
          </div>
          <div className="border-l border-subtle pl-2.5">
            <div className="text-[10px] text-ink-muted">Total Omzet:</div>
            <div className="font-mono font-bold text-emerald-700 tabular-nums">
              Rp {totalOmzet.toLocaleString("id-ID")}
            </div>
          </div>
          <div className="border-l border-subtle pl-2.5 hidden sm:block">
            <div className="text-[10px] text-ink-muted">Metode:</div>
            <div className="text-[10px] font-medium text-ink-muted flex items-center gap-1.5 mt-0.5">
              <span className="text-emerald-700 font-bold">{cashCount} Cash</span>
              <span>•</span>
              <span className="text-blue-700 font-bold">{qrisCount} QRIS</span>
              {voidCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-red-600 font-bold">{voidCount} Void</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Panel Tabel & Filter */}
      <div className="bg-white rounded-xl border border-subtle shadow-xs overflow-hidden flex flex-col">
        {/* Filter Bar */}
        <div className="p-3.5 border-b border-subtle bg-neutral-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-ink-muted" />
              <input
                type="text"
                placeholder="Cari nomor struk (INV) atau nama produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-ink"
            >
              <option value="ALL">Semua Pembayaran</option>
              <option value="CASH">Tunai (CASH)</option>
              <option value="QRIS">Non-Tunai (QRIS)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-ink"
            >
              <option value="ALL">Semua Status</option>
              <option value="PAID">Berhasil (Selesai)</option>
              <option value="VOIDED">Dibatalkan (Void)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={fetchTransactions}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-subtle bg-white hover:bg-neutral-100 text-ink text-xs font-semibold shadow-xs transition-colors"
              title="Muat ulang riwayat"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-ink-muted ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Tabel Data Struk */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-subtle bg-neutral-100/60 text-ink-muted font-bold text-[11px]">
                <th className="py-2.5 px-3">No Struk / Invoice</th>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Terminal</th>
                <th className="py-2.5 px-3">Ringkasan Item Belanja</th>
                <th className="py-2.5 px-3 text-right">Total Tagihan</th>
                <th className="py-2.5 px-3 text-center">Metode</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-ink-muted">
                    Memuat data riwayat transaksi penjualan...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-ink-muted">
                    Tidak ada riwayat transaksi yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => {
                  const isVoided = t.status === "VOIDED";
                  const formattedTime = new Date(t.created_at).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const formattedDate = new Date(t.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  });

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-neutral-50/80 transition-colors ${
                        isVoided ? "bg-red-50/30 opacity-75" : ""
                      }`}
                    >
                      {/* No Struk */}
                      <td className="py-2.5 px-3 font-mono font-bold text-ink">
                        <span className={isVoided ? "line-through text-red-700" : ""}>
                          {t.invoice_number}
                        </span>
                      </td>

                      {/* Waktu */}
                      <td className="py-2.5 px-3 text-ink-muted whitespace-nowrap text-[11px]">
                        <div>{formattedTime} WIB</div>
                        <div className="text-[10px] text-neutral-400">{formattedDate}</div>
                      </td>

                      {/* Terminal */}
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-ink border border-subtle">
                          {t.device_terminal}
                        </span>
                      </td>

                      {/* Ringkasan Item */}
                      <td className="py-2.5 px-3 text-ink max-w-[260px]">
                        <div className="truncate font-medium text-[11px]">
                          {t.items.map((i) => `${i.qty}x ${i.product_name_snapshot}`).join(", ")}
                        </div>
                        <div className="text-[10px] text-ink-muted">
                          {t.items.length} macam produk / layanan
                        </div>
                      </td>

                      {/* Total Tagihan */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-ink">
                        <span className={isVoided ? "line-through text-red-600" : ""}>
                          Rp {t.total_amount.toLocaleString("id-ID")}
                        </span>
                      </td>

                      {/* Metode */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            t.payment_method === "CASH"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                        >
                          {t.payment_method === "CASH" ? (
                            <Banknote className="w-3 h-3" />
                          ) : (
                            <CreditCard className="w-3 h-3" />
                          )}
                          <span>{t.payment_method}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center">
                        {isVoided ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300">
                            VOID
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            SUKSES
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedTxForReceipt(t)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-subtle bg-white hover:bg-neutral-100 text-ink text-[11px] font-semibold shadow-2xs transition-colors"
                            title="Cetak ulang struk thermal"
                          >
                            <Printer className="w-3.5 h-3.5 text-primary" />
                            <span>Cetak Struk</span>
                          </button>

                          {!isVoided && (
                            <button
                              onClick={() => setSelectedTxForVoid(t)}
                              className="flex items-center gap-1 px-2 py-1 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-semibold transition-colors"
                              title="Ajukan pembatalan (Void) dengan PIN supervisor"
                            >
                              <Ban className="w-3 h-3 text-red-600" />
                              <span>Void</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Struk Kasir */}
      <ReceiptModal
        isOpen={!!selectedTxForReceipt}
        onClose={() => setSelectedTxForReceipt(null)}
        transaction={selectedTxForReceipt}
      />

      {/* Modal Void Transaksi */}
      <VoidTransactionModal
        isOpen={!!selectedTxForVoid}
        onClose={() => setSelectedTxForVoid(null)}
        transaction={selectedTxForVoid}
        onVoidSuccess={() => {
          setSelectedTxForVoid(null);
          fetchTransactions();
        }}
      />
    </div>
  );
}
