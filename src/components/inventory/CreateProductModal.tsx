"use client";

import React, { useState } from "react";
import { X, Plus, AlertCircle } from "lucide-react";
import { useShiftStore } from "@/store/useShiftStore";
import { usePosTerminalStore } from "@/store/usePosTerminalStore";

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProductModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateProductModalProps) {
  const { shift } = useShiftStore();
  const { terminalId } = usePosTerminalStore();

  const [name, setName] = useState("");
  const [itemType, setItemType] = useState<"SERVICE" | "GOODS">("GOODS");
  const [categoryName, setCategoryName] = useState("Merchandise & Kartu");
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [stockQty, setStockQty] = useState<number>(50);
  const [unit, setUnit] = useState("pcs");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nama produk wajib diisi.");
      return;
    }

    if (sellingPrice < costPrice) {
      if (!confirm("Peringatan: Harga jual lebih rendah dari harga modal. Apakah Anda yakin ingin melanjutkan?")) {
        return;
      }
    }

    const prefix = itemType === "SERVICE" ? "JSA" : "BRG";
    const rand = Math.floor(Math.random() * 9000 + 1000);
    const code = name
      ? name.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, "X")
      : "ITEM";
    const autoSku = `${prefix}-${code}-${rand}`;

    try {
      setIsLoading(true);
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: autoSku,
          name: name.trim(),
          item_type: itemType,
          category_name: categoryName,
          cost_price: costPrice,
          selling_price: sellingPrice,
          stock_qty: itemType === "GOODS" ? stockQty : null,
          unit: unit.trim(),
          shift_id: shift?.id || null,
          device_terminal: terminalId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menambahkan produk.");
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
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs shadow-xs shrink-0">
              <Plus className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-ink">Tambah Item Katalog Baru</h2>
              <p className="text-[10px] text-ink-muted">
                Produk baru akan langsung aktif di layar kasir & tercatat di audit log
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Tipe Item */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Tipe Layanan / Produk:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setItemType("SERVICE");
                  setUnit("lembar");
                }}
                className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center ${
                  itemType === "SERVICE"
                    ? "bg-sky-50 text-sky-800 border-sky-400 shadow-xs"
                    : "bg-white text-ink border-subtle hover:bg-neutral-50"
                }`}
              >
                ● JASA (SERVICE - Tanpa Stok)
              </button>
              <button
                type="button"
                onClick={() => {
                  setItemType("GOODS");
                  setUnit("pcs");
                }}
                className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center ${
                  itemType === "GOODS"
                    ? "bg-indigo-50 text-indigo-800 border-indigo-400 shadow-xs"
                    : "bg-white text-ink border-subtle hover:bg-neutral-50"
                }`}
              >
                ■ BARANG (GOODS - Pakai Stok)
              </button>
            </div>
          </div>

          {/* Nama Produk */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Nama Produk / Jasa:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Cetak Stiker Transparan A3+"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Kategori & Satuan */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Kategori:
              </label>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="Print & Fotocopy">Print & Fotocopy</option>
                <option value="Jilid & Finishing">Jilid & Finishing</option>
                <option value="Merchandise & Kartu">Merchandise & Kartu</option>
                <option value="Kertas & ATK">Kertas & ATK</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Satuan Unit:
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="lembar, pcs, buku, paket"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Harga Modal (HPP) & Harga Jual Kasir */}
          <div className="grid grid-cols-2 gap-2.5 p-3 rounded-lg bg-neutral-50 border border-subtle">
            <div>
              <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                Harga Modal (HPP):
              </label>
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

            <div>
              <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                Harga Jual Terkunci di Kasir:
              </label>
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

          {/* Stok Awal (khusus GOODS) */}
          {itemType === "GOODS" && (
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Stok Awal Gudang:
              </label>
              <input
                type="number"
                min="0"
                value={stockQty}
                onChange={(e) => setStockQty(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
              />
            </div>
          )}

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
              <Plus className="w-3.5 h-3.5" />
              <span>{isLoading ? "Menyimpan..." : "Simpan Produk"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
