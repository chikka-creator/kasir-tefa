"use client";

import React, { useState } from "react";
import { X, PackagePlus, AlertCircle, ArrowRight } from "lucide-react";
import { InventoryProduct } from "@/lib/inventory-data";
import { useShiftStore } from "@/store/useShiftStore";
import { usePosTerminalStore } from "@/store/usePosTerminalStore";

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: InventoryProduct | null;
  onSuccess: () => void;
}

export function RestockModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: RestockModalProps) {
  const { shift } = useShiftStore();
  const { terminalId } = usePosTerminalStore();

  const [qtyAdded, setQtyAdded] = useState<number>(10);
  const [supplierNotes, setSupplierNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const stockBefore = product.stock_qty ?? 0;
  const stockAfter = stockBefore + (qtyAdded > 0 ? qtyAdded : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (qtyAdded <= 0) {
      setError("Jumlah barang masuk harus lebih dari 0.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/stock/restock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          qty_added: qtyAdded,
          supplier_notes: supplierNotes.trim() || undefined,
          shift_id: shift?.id || null,
          device_terminal: terminalId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal restock produk.");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-xl border border-subtle bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-subtle px-4 sm:px-5 py-3 sm:py-3.5 bg-neutral-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-xs shrink-0">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-ink">Restock Barang Masuk</h2>
              <p className="text-[10px] text-ink-muted">
                {product.name} ({product.sku})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-ink-muted hover:bg-neutral-200 hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Kalkulasi Perubahan Stok */}
          <div className="p-3.5 rounded-lg border border-subtle bg-neutral-50 flex items-center justify-around text-center">
            <div>
              <span className="text-[10px] text-ink-muted block">Stok Saat Ini:</span>
              <span className="text-sm font-mono font-bold text-ink tabular-nums">
                {stockBefore} {product.unit}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-ink-muted" />
            <div>
              <span className="text-[10px] text-emerald-800 font-bold block">+ Masuk:</span>
              <span className="text-sm font-mono font-bold text-emerald-700 tabular-nums">
                +{qtyAdded > 0 ? qtyAdded : 0} {product.unit}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-ink-muted" />
            <div>
              <span className="text-[10px] text-ink-muted block">Stok Akhir:</span>
              <span className="text-sm font-mono font-bold text-primary tabular-nums">
                {stockAfter} {product.unit}
              </span>
            </div>
          </div>

          {/* Input Jumlah Barang Masuk */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Jumlah Barang Masuk ({product.unit}):
            </label>
            <input
              type="number"
              min="1"
              required
              value={qtyAdded === 0 ? "" : qtyAdded}
              onChange={(e) => setQtyAdded(Number(e.target.value))}
              placeholder="10"
              className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
            />
          </div>

          {/* Catatan Supplier / Faktur */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Catatan / No. Surat Jalan Supplier (Opsional):
            </label>
            <textarea
              rows={2}
              value={supplierNotes}
              onChange={(e) => setSupplierNotes(e.target.value)}
              placeholder="Contoh: Faktur Toko Kertas Maju Jaya #INV-0912"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-neutral-400"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-3.5 py-1.5 rounded-lg border border-subtle text-xs font-semibold text-ink hover:bg-neutral-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>{isLoading ? "Menyimpan..." : "Tambah Stok"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
