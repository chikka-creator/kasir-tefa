"use client";

import React, { useState, useEffect } from "react";
import { ProductCatalog } from "@/components/pos/ProductCatalog";
import { CartPanel } from "@/components/pos/CartPanel";
import { ReceiptModal } from "@/components/pos/ReceiptModal";
import { ShiftStatusBar } from "@/components/pos/ShiftStatusBar";
import { PosSubNav } from "@/components/pos/PosSubNav";
import { usePosCartStore, CartItem } from "@/store/usePosCartStore";
import { usePosTerminalStore } from "@/store/usePosTerminalStore";
import { useShiftStore } from "@/store/useShiftStore";
import { TransactionRecord } from "@/lib/shifts-data";
import { ShoppingCart, Package, ArrowRight } from "lucide-react";

interface PosMainScreenProps {
  initialProducts: Array<Omit<CartItem, "qty">>;
}

export function PosMainScreen({ initialProducts }: PosMainScreenProps) {
  const { terminalId } = usePosTerminalStore();
  const { addItem, getTotalItemsCount, getTotalAmount } = usePosCartStore();
  const { shift } = useShiftStore();

  const [activeReceiptTx, setActiveReceiptTx] = useState<TransactionRecord | null>(null);
  const [mobileView, setMobileView] = useState<"CATALOG" | "CART">("CATALOG");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItemsCount = mounted ? getTotalItemsCount(terminalId) : 0;
  const totalAmount = mounted ? getTotalAmount(terminalId) : 0;

  const handleAddToCart = (product: Omit<CartItem, "qty">) => {
    addItem(terminalId, product, 1);
  };

  const handleTransactionSuccess = (tx: TransactionRecord) => {
    setActiveReceiptTx(tx);
    // Kembali ke katalog di mobile setelah transaksi selesai
    setMobileView("CATALOG");
  };

  return (
    <div className="flex-1 flex flex-col p-2.5 sm:p-4 max-w-7xl w-full mx-auto space-y-3">
      {/* 1. Bar Status Shift Bersama & Laci Kas */}
      <ShiftStatusBar />

      {/* 2. Sub-Navigasi POS, Katalog & Stok, Lapor Salah Print */}
      <PosSubNav />

      {/* 3. Mobile Tab Toggle (< lg only) */}
      <div className="lg:hidden flex items-center rounded-xl border border-subtle bg-neutral-100 p-1 text-xs font-bold">
        <button
          onClick={() => setMobileView("CATALOG")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
            mobileView === "CATALOG"
              ? "bg-white text-ink shadow-xs"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Katalog Produk</span>
        </button>

        <button
          onClick={() => setMobileView("CART")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all relative ${
            mobileView === "CART"
              ? "bg-white text-ink shadow-xs"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Keranjang Belanja</span>
          {totalItemsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
              {totalItemsCount}
            </span>
          )}
        </button>
      </div>

      {/* 4. Layar Utama Split-Screen di Desktop, Responsive Toggle di Mobile */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-[520px]">
        {/* Kiri (65%): Katalog Produk & Layanan Percetakan */}
        <div
          className={`flex-1 flex flex-col ${
            mobileView === "CATALOG" ? "flex" : "hidden lg:flex"
          }`}
        >
          <ProductCatalog
            products={initialProducts}
            onAddToCart={handleAddToCart}
          />
        </div>

        {/* Kanan (35%): Panel Keranjang & Pembayaran Kasir */}
        <div
          className={`w-full lg:w-auto flex flex-col ${
            mobileView === "CART" ? "flex" : "hidden lg:flex"
          }`}
        >
          <CartPanel
            onTransactionSuccess={handleTransactionSuccess}
            onBackToCatalog={() => setMobileView("CATALOG")}
          />
        </div>
      </div>

      {/* 5. Sticky Floating Cart Bar di Mobile (< lg) saat melihat Katalog & ada item */}
      {mobileView === "CATALOG" && totalItemsCount > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 p-3 bg-slate-900/95 text-white backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl z-40 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-white shadow-inner">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {totalItemsCount}
              </span>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Tagihan:</div>
              <div className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                Rp {totalAmount.toLocaleString("id-ID")}
              </div>
            </div>
          </div>

          <button
            onClick={() => setMobileView("CART")}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <span>Bayar Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal Cetak Struk Otomatis Pasca Transaksi */}
      <ReceiptModal
        isOpen={!!activeReceiptTx}
        onClose={() => setActiveReceiptTx(null)}
        transaction={activeReceiptTx}
        shiftInfo={shift}
      />
    </div>
  );
}
