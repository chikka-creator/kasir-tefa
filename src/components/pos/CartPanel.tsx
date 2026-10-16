"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Trash2,
  Plus,
  Minus,
  Banknote,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Receipt,
  RotateCcw,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { usePosCartStore, CartItem } from "@/store/usePosCartStore";
import { usePosTerminalStore } from "@/store/usePosTerminalStore";
import { useShiftStore } from "@/store/useShiftStore";
import { TransactionRecord } from "@/lib/shifts-data";

interface CartPanelProps {
  onTransactionSuccess: (tx: TransactionRecord) => void;
  onBackToCatalog?: () => void;
}

export function CartPanel({ onTransactionSuccess, onBackToCatalog }: CartPanelProps) {
  const { terminalId, terminalName } = usePosTerminalStore();
  const { shift, fetchActiveShift } = useShiftStore();
  const {
    carts,
    updateQty,
    removeItem,
    clearCart,
    getTotalAmount,
    getTotalItemsCount,
    getTotalUnitsCount,
  } = usePosCartStore();

  const [mounted, setMounted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS">("CASH");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const items = mounted ? carts[terminalId] || [] : [];
  const totalAmount = mounted ? getTotalAmount(terminalId) : 0;
  const totalItemsCount = mounted ? getTotalItemsCount(terminalId) : 0;
  const totalUnitsCount = mounted ? getTotalUnitsCount(terminalId) : 0;

  // Set default cash received to total amount whenever total changes and method is cash
  useEffect(() => {
    if (cashReceived < totalAmount) {
      setCashReceived(totalAmount);
    }
  }, [totalAmount]);

  const cashChange = Math.max(0, cashReceived - totalAmount);
  const isCashInsufficient = paymentMethod === "CASH" && cashReceived < totalAmount;

  const handleCheckout = useCallback(async () => {
    setErrorMessage(null);

    if (!shift) {
      setErrorMessage("Sesi shift kasir belum dibuka! Silakan klik tombol '+ Buka Shift Kasir' berwarna hijau di bar atas untuk mengisi modal kas awal sebelum melayani transaksi.");
      return;
    }

    if (items.length === 0) {
      setErrorMessage("Keranjang belanja masih kosong.");
      return;
    }

    if (paymentMethod === "CASH" && cashReceived < totalAmount) {
      setErrorMessage("Uang tunai yang diterima kurang dari total tagihan.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        shift_id: shift.id,
        device_terminal: terminalId,
        items: items.map((i) => ({
          product_id: i.id,
          product_name_snapshot: i.name,
          item_type_snapshot: i.item_type,
          qty: i.qty,
          cost_price_snapshot: i.cost_price,
          selling_price_snapshot: i.selling_price,
          subtotal: i.selling_price * i.qty,
        })),
        payment_method: paymentMethod,
        cash_received: paymentMethod === "CASH" ? cashReceived : null,
        cash_change: paymentMethod === "CASH" ? cashChange : null,
        // QRIS diselesaikan langsung oleh admin tanpa input no referensi pelanggan
        qris_reference: paymentMethod === "QRIS" ? "QRIS-STATIS-VERIFIED" : undefined,
      };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses transaksi.");
      }

      // Bersihkan keranjang belanja terminal ini
      clearCart(terminalId);
      // Perbarui ringkasan saldo laci
      await fetchActiveShift();
      // Buka modal cetak struk
      onTransactionSuccess(data.transaction);
    } catch (err: unknown) {
      console.error("Checkout error:", err);
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan pembayaran.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    shift,
    items,
    paymentMethod,
    cashReceived,
    totalAmount,
    terminalId,
    cashChange,
    clearCart,
    fetchActiveShift,
    onTransactionSuccess,
  ]);

  // Listener tombol shortcut F9 untuk Bayar Cepat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F9") {
        e.preventDefault();
        if (items.length > 0 && !isSubmitting && !isCashInsufficient) {
          handleCheckout();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCheckout, items.length, isSubmitting, isCashInsufficient]);

  const setPresetCash = (amount: number) => {
    setCashReceived(amount);
  };

  if (!mounted) {
    return (
      <div className="w-full lg:w-[380px] xl:w-[420px] bg-white rounded-xl border border-subtle p-4 shadow-xs">
        <p className="text-xs text-ink-muted">Memuat keranjang belanja...</p>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-[380px] xl:w-[420px] flex flex-col bg-white rounded-xl border border-subtle shadow-xs overflow-hidden">
      {/* 1. Header Keranjang */}
      <div className="p-3 sm:p-3.5 border-b border-subtle bg-neutral-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBackToCatalog && (
            <button
              onClick={onBackToCatalog}
              className="lg:hidden flex items-center gap-1 text-[11px] font-semibold text-ink bg-white border border-subtle hover:bg-neutral-100 px-2.5 py-1 rounded-md shadow-2xs transition-colors"
              title="Kembali ke Katalog"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Katalog</span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-ink">Keranjang</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 text-white">
                {terminalId}
              </span>
            </div>
            <p className="text-[10px] text-ink-muted mt-0.5">{terminalName}</p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            onClick={() => clearCart(terminalId)}
            className="flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded transition-colors"
            title="Kosongkan keranjang"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* 2. List Item Keranjang */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 max-h-[340px]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-ink-muted">
            <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center mb-2">
              <Receipt className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-xs font-semibold text-ink">Keranjang Belanja Kosong</p>
            <p className="text-[11px] text-ink-muted mt-0.5 max-w-[200px]">
              Klik item pada katalog di sebelah kiri untuk menambah ke antrean pesanan.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const isService = item.item_type === "SERVICE";
            const subtotal = item.selling_price * item.qty;

            return (
              <div
                key={item.id}
                className="p-2.5 rounded-lg border border-subtle bg-white shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span
                        className={`text-[8px] font-bold px-1 py-0.2 rounded ${
                          isService
                            ? "bg-service-bg text-service border border-sky-200"
                            : "bg-goods-bg text-goods border border-indigo-200"
                        }`}
                      >
                        {isService ? "JASA" : "BARANG"}
                      </span>
                      <span className="text-[10px] text-ink-muted font-mono">{item.sku}</span>
                    </div>
                    <h5 className="text-xs font-bold text-ink leading-tight line-clamp-1">
                      {item.name}
                    </h5>
                    <div className="text-[10px] text-ink-muted font-mono mt-0.5">
                      @ Rp {item.selling_price.toLocaleString("id-ID")} /{item.unit}
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(terminalId, item.id)}
                    className="text-neutral-400 hover:text-red-600 p-1 rounded hover:bg-neutral-100 transition-colors"
                    title="Hapus dari keranjang"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Input Kuantitas Langsung & Subtotal */}
                <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(terminalId, item.id, item.qty - 1)}
                      className="h-6 w-6 rounded border border-subtle bg-neutral-50 hover:bg-neutral-200 flex items-center justify-center text-ink text-xs font-bold transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>

                    {/* Input angka bebas (bisa ketik langsung misal 150 lembar) */}
                    <input
                      type="number"
                      min="1"
                      max={item.stock_qty ?? 999999}
                      value={item.qty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        updateQty(terminalId, item.id, isNaN(val) ? 1 : val);
                      }}
                      className="w-16 h-6 px-1 text-center font-mono font-bold text-xs rounded border border-subtle bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 tabular-nums"
                    />

                    <button
                      onClick={() => updateQty(terminalId, item.id, item.qty + 1)}
                      className="h-6 w-6 rounded border border-subtle bg-neutral-50 hover:bg-neutral-200 flex items-center justify-center text-ink text-xs font-bold transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-mono font-bold text-ink tabular-nums">
                      Rp {subtotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Panel Ringkasan & Pembayaran */}
      <div className="p-3.5 border-t border-subtle bg-neutral-50 space-y-3">
        {errorMessage && (
          <div className="flex items-start gap-1.5 p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Ringkasan Subtotal */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-ink-muted text-[11px]">
            <span>Total Item:</span>
            <span>
              {totalItemsCount} item ({totalUnitsCount} unit)
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1 border-t border-subtle">
            <span className="text-xs font-bold text-ink">TOTAL TAGIHAN:</span>
            <span className="text-lg font-bold font-mono text-ink tabular-nums">
              Rp {totalAmount.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Tab Metode Pembayaran */}
        <div className="pt-2 border-t border-subtle space-y-2.5">
          <label className="block text-[11px] font-semibold text-ink">
            Metode Pembayaran:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("CASH")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                paymentMethod === "CASH"
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-ink border-subtle hover:bg-neutral-100"
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>CASH / TUNAI</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("QRIS")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                paymentMethod === "QRIS"
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-ink border-subtle hover:bg-neutral-100"
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QRIS STATIS</span>
            </button>
          </div>

          {/* Opsi Pembayaran Tunai (CASH) */}
          {paymentMethod === "CASH" && (
            <div className="p-2.5 rounded-lg border border-subtle bg-white space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted text-[11px]">Uang Diterima:</span>
                <div className="relative w-36">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-xs font-bold text-ink-muted">
                    Rp
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={cashReceived === 0 ? "" : cashReceived}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    placeholder="0"
                    className="w-full pl-7 pr-2 py-1 text-right text-xs font-mono font-bold text-ink rounded border border-subtle bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 tabular-nums"
                  />
                </div>
              </div>

              {/* Tombol Pecahan Cepat */}
              <div className="flex items-center gap-1 flex-wrap text-[10px]">
                <button
                  type="button"
                  onClick={() => setPresetCash(totalAmount)}
                  className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 border border-subtle font-semibold"
                >
                  Uang Pas
                </button>
                <button
                  type="button"
                  onClick={() => setPresetCash(10000)}
                  className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 border border-subtle font-semibold"
                >
                  10rb
                </button>
                <button
                  type="button"
                  onClick={() => setPresetCash(20000)}
                  className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 border border-subtle font-semibold"
                >
                  20rb
                </button>
                <button
                  type="button"
                  onClick={() => setPresetCash(50000)}
                  className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 border border-subtle font-semibold"
                >
                  50rb
                </button>
                <button
                  type="button"
                  onClick={() => setPresetCash(100000)}
                  className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 border border-subtle font-semibold"
                >
                  100rb
                </button>
              </div>

              {/* Kembalian */}
              <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-xs">
                <span className="text-ink font-semibold">Kembalian:</span>
                <span
                  className={`font-mono font-bold text-sm tabular-nums ${
                    isCashInsufficient ? "text-red-600" : "text-emerald-700"
                  }`}
                >
                  Rp {cashChange.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          )}

          {/* Opsi QRIS Statis: Tanpa input no referensi pelanggan */}
          {paymentMethod === "QRIS" && (
            <div className="p-3 rounded-lg border border-subtle bg-white text-center space-y-2">
              <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-neutral-50 border border-dashed border-neutral-300">
                {/* Visual SVG QR Code Standar Indonesia */}
                <div className="bg-white p-2 rounded-md border border-subtle shadow-xs mb-1">
                  <svg className="w-28 h-28 mx-auto" viewBox="0 0 100 100" fill="none">
                    <rect width="100" height="100" fill="white" />
                    {/* Corner 1 */}
                    <rect x="10" y="10" width="24" height="24" fill="#18181B" />
                    <rect x="14" y="14" width="16" height="16" fill="white" />
                    <rect x="18" y="18" width="8" height="8" fill="#18181B" />
                    {/* Corner 2 */}
                    <rect x="66" y="10" width="24" height="24" fill="#18181B" />
                    <rect x="70" y="14" width="16" height="16" fill="white" />
                    <rect x="74" y="18" width="8" height="8" fill="#18181B" />
                    {/* Corner 3 */}
                    <rect x="10" y="66" width="24" height="24" fill="#18181B" />
                    <rect x="14" y="70" width="16" height="16" fill="white" />
                    <rect x="18" y="74" width="8" height="8" fill="#18181B" />
                    {/* Pattern Dots */}
                    <rect x="42" y="14" width="6" height="6" fill="#18181B" />
                    <rect x="52" y="14" width="6" height="6" fill="#18181B" />
                    <rect x="42" y="24" width="6" height="6" fill="#18181B" />
                    <rect x="38" y="38" width="24" height="24" fill="#18181B" />
                    <rect x="44" y="44" width="12" height="12" fill="white" />
                    <rect x="48" y="48" width="4" height="4" fill="#18181B" />
                    <rect x="68" y="44" width="6" height="6" fill="#18181B" />
                    <rect x="78" y="54" width="6" height="6" fill="#18181B" />
                    <rect x="42" y="72" width="6" height="6" fill="#18181B" />
                    <rect x="54" y="78" width="6" height="6" fill="#18181B" />
                    <rect x="68" y="70" width="8" height="8" fill="#18181B" />
                  </svg>
                </div>
                <div className="text-[10px] font-bold text-ink">QRIS STATIS TEFA PERCETAKAN</div>
                <div className="text-[9px] text-ink-muted">NMID: ID1020261015001</div>
              </div>

              <div className="text-[10px] text-ink-muted leading-tight">
                💡 Pelanggan memindai QRIS di meja kasir. Setelah pembayaran berhasil diverifikasi oleh kasir, klik tombol di bawah untuk menyelesaikan transaksi.
              </div>
            </div>
          )}
        </div>

        {/* Notifikasi jika shift belum aktif */}
        {!shift && items.length > 0 && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Shift Kasir Belum Dibuka:</strong>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Klik tombol <strong className="text-emerald-700 underline">+ Buka Shift Kasir</strong> di bagian atas untuk mencatat modal kas sebelum melayani transaksi.
              </p>
            </div>
          </div>
        )}

        {/* Tombol Utama Bayar (Shortcut F9) */}
        <button
          type="button"
          onClick={handleCheckout}
          disabled={items.length === 0 || isSubmitting || isCashInsufficient}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-xs shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            !shift
              ? "bg-amber-600 hover:bg-amber-700 text-white"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          }`}
        >
          {isSubmitting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : !shift ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span>
            {isSubmitting
              ? "Memproses Pembayaran..."
              : !shift
              ? "BUKA SHIFT KASIR DAHULU"
              : paymentMethod === "CASH"
              ? "BAYAR & CETAK STRUK (F9)"
              : "KONFIRMASI PEMBAYARAN QRIS (F9)"}
          </span>
        </button>
      </div>
    </div>
  );
}
