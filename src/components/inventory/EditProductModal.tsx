"use client";

import React, { useState } from "react";
import { X, Check, AlertTriangle, AlertCircle, TrendingUp } from "lucide-react";
import { InventoryProduct } from "@/lib/inventory-data";
import { useShiftStore } from "@/store/useShiftStore";
import { usePosTerminalStore } from "@/store/usePosTerminalStore";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: InventoryProduct | null;
  onSuccess: () => void;
}

export function EditProductModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: EditProductModalProps) {
  const { shift } = useShiftStore();
  const { terminalId } = usePosTerminalStore();

  const [name, setName] = useState(product?.name || "");
  const [costPrice, setCostPrice] = useState<number>(product?.cost_price || 0);
  const [sellingPrice, setSellingPrice] = useState<number>(product?.selling_price || 0);
  const [unit, setUnit] = useState(product?.unit || "pcs");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (product) {
      setName(product.name);
      setCostPrice(product.cost_price);
      setSellingPrice(product.selling_price);
      setUnit(product.unit);
      setError(null);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsLoading(true);
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          cost_price: costPrice,
          selling_price: sellingPrice,
          unit: unit.trim(),
          shift_id: shift?.id || null,
          device_terminal: terminalId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui harga produk.");
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
      <div className="w-full max-w-lg rounded-xl border border-subtle bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-subtle px-4 sm:px-5 py-3 sm:py-3.5 bg-neutral-50 shrink-0">
          <div>
            <h2 className="text-xs font-bold text-ink">Edit Harga & Informasi Produk</h2>
            <p className="text-[10px] text-ink-muted">
              Tipe: <span className="font-bold text-ink">{product.item_type === "SERVICE" ? "JASA" : "BARANG"}</span>
            </p>
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

          {/* Alert Security Warning */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-200 bg-amber-50/80 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="font-bold">Perhatian Keamanan & Audit Trail:</strong>
              <p className="mt-0.5 text-amber-800">
                Perubahan harga akan langsung aktif di meja kasir. Perubahan ini otomatis dicatat ke dalam rekam jejak sistem (Audit Log Level <strong>WARNING</strong>) untuk diperiksa oleh Guru Pembimbing.
              </p>
            </div>
          </div>

          {/* Nama Produk */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Nama Produk / Layanan:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Komparasi Nilai Lama vs Nilai Baru */}
          <div className="p-3.5 rounded-lg border border-subtle bg-neutral-50 space-y-3">
            <div className="text-[11px] font-bold text-ink flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span>Pengaturan Harga Modal & Harga Jual:</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Harga Modal (HPP) */}
              <div>
                <label className="block text-[10px] font-semibold text-ink-muted mb-1">
                  Harga Modal (HPP):
                </label>
                <div className="text-[10px] text-ink-muted mb-1 font-mono">
                  Lama: Rp {product.cost_price.toLocaleString("id-ID")}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-xs font-bold text-ink-muted">
                    Rp
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full pl-8 pr-2.5 py-1 text-xs font-mono font-bold text-ink rounded border border-subtle bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 tabular-nums"
                  />
                </div>
              </div>

              {/* Harga Jual */}
              <div>
                <label className="block text-[10px] font-semibold text-ink-muted mb-1">
                  Harga Jual Kasir:
                </label>
                <div className="text-[10px] text-ink-muted mb-1 font-mono">
                  Lama: Rp {product.selling_price.toLocaleString("id-ID")}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-xs font-bold text-ink-muted">
                    Rp
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full pl-8 pr-2.5 py-1 text-xs font-mono font-bold text-ink rounded border border-subtle bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 tabular-nums"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Satuan Unit */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Satuan Unit:
            </label>
            <input
              type="text"
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
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
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isLoading ? "Menyimpan Perubahan..." : "Terapkan Harga Baru"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
