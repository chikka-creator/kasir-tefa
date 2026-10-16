"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Send,
  History,
  FileWarning,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Printer,
  FileX,
  PackageX,
  HelpCircle,
} from "lucide-react";
import { PosSubNav } from "@/components/pos/PosSubNav";
import { InventoryProduct, StockMovementRecord } from "@/lib/inventory-data";
import { useShiftStore } from "@/store/useShiftStore";
import { usePosTerminalStore } from "@/store/usePosTerminalStore";

export default function BarangRusakPage() {
  const { shift } = useShiftStore();
  const { terminalId } = usePosTerminalStore();

  const [goodsProducts, setGoodsProducts] = useState<InventoryProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qtyDamaged, setQtyDamaged] = useState<number>(1);
  const [reasonCategory, setReasonCategory] = useState<string>("PAPER_JAM");
  const [notes, setNotes] = useState("");

  const [spoilageList, setSpoilageList] = useState<StockMovementRecord[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch goods products for dropdown
  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      const goods = (data.products || []).filter((p: InventoryProduct) => p.item_type === "GOODS");
      setGoodsProducts(goods);
      if (goods.length > 0 && !selectedProductId) {
        setSelectedProductId(goods[0].id);
      }
    } catch (err) {
      console.error("fetchProducts error:", err);
    }
  };

  // Fetch recent spoilage reports
  const fetchSpoilageList = async () => {
    try {
      setIsLoadingList(true);
      const url = shift?.id
        ? `/api/stock/spoilage/recent?shift_id=${shift.id}`
        : "/api/stock/spoilage/recent";
      const res = await fetch(url);
      const data = await res.json();
      setSpoilageList(data.spoilage_reports || []);
    } catch (err) {
      console.error("fetchSpoilageList error:", err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSpoilageList();
  }, [shift?.id]);

  const selectedProduct = goodsProducts.find((p) => p.id === selectedProductId);
  const estimatedLoss = selectedProduct ? selectedProduct.cost_price * (qtyDamaged > 0 ? qtyDamaged : 0) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!selectedProductId) {
      setStatusMessage({ type: "error", text: "Pilih barang atau bahan baku terlebih dahulu." });
      return;
    }

    if (qtyDamaged <= 0) {
      setStatusMessage({ type: "error", text: "Jumlah barang rusak harus lebih dari 0." });
      return;
    }

    if (!notes.trim() || notes.trim().length < 5) {
      setStatusMessage({ type: "error", text: "Keterangan detail alasan wajib diisi (minimal 5 karakter)." });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/stock/spoilage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedProductId,
          qty_damaged: qtyDamaged,
          reason_category: reasonCategory,
          notes: notes.trim(),
          shift_id: shift?.id || null,
          device_terminal: terminalId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mencatat barang rusak.");
      }

      setStatusMessage({
        type: "success",
        text: `Berhasil mencatat laporan barang rusak (-${qtyDamaged} unit '${data.product.name}'). Stok gudang telah diperbarui.`,
      });

      // Reset form
      setNotes("");
      setQtyDamaged(1);
      // Refresh list & products
      fetchProducts();
      fetchSpoilageList();
    } catch (err: unknown) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan sistem saat melapor.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalLossShift = spoilageList.reduce((sum, item) => sum + (item.loss_value || 0), 0);
  const totalItemsDamaged = spoilageList.reduce((sum, item) => sum + Math.abs(item.qty_change), 0);

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 max-w-7xl w-full mx-auto space-y-4">
      {/* 1. Sub-Navigasi Tab Kasir */}
      <PosSubNav />

      {/* 2. Banner Edukasi Kejujuran & Audit Trail */}
      <div className="bg-white rounded-xl border border-subtle p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
            <FileWarning className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-bold text-ink">Form Lapor Barang Rusak / Salah Print (Spoilage)</h1>
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                Transparansi Bahan TeFa
              </span>
            </div>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Siswa piket diharapkan jujur mencatat kertas nyangkut, salah setting cetak, atau bahan cacat agar pembukuan stok dan HPP sekolah tetap akurat.
            </p>
          </div>
        </div>

        {/* Ringkasan Kerugian Shift Ini */}
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-neutral-50 border border-subtle text-xs shrink-0">
          <div>
            <div className="text-[10px] text-ink-muted">Total Rusak Shift Ini:</div>
            <div className="font-mono font-bold text-ink">
              {totalItemsDamaged} <span className="text-[10px] font-normal text-ink-muted">unit</span>
            </div>
          </div>
          <div className="border-l border-subtle pl-3">
            <div className="text-[10px] text-ink-muted">Estimasi Nilai HPP:</div>
            <div className="font-mono font-bold text-red-600 tabular-nums">
              Rp {totalLossShift.toLocaleString("id-ID")}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Form Input & Tabel Laporan (Grid 40% : 60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Kolom Kiri: Form Lapor (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-subtle p-4 shadow-xs flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="border-b border-subtle pb-2.5">
              <h2 className="text-xs font-bold text-ink flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Input Laporan Barang Rusak
              </h2>
              <p className="text-[10px] text-ink-muted">
                Pengurangan stok akan otomatis diverifikasi oleh Guru Pembimbing
              </p>
            </div>

            {statusMessage && (
              <div
                className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${
                  statusMessage.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Dropdown Barang/Bahan */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Pilih Barang / Bahan Baku (Barang Fisik):
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold"
              >
                {goodsProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Tersedia: {p.stock_qty ?? 0} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Jumlah Rusak */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Jumlah Rusak / Terbuang ({selectedProduct?.unit || "unit"}):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={selectedProduct?.stock_qty ?? 99999}
                  required
                  value={qtyDamaged === 0 ? "" : qtyDamaged}
                  onChange={(e) => setQtyDamaged(Number(e.target.value))}
                  placeholder="1"
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-ink-muted mt-1">
                <span>Stok tersedia: {selectedProduct?.stock_qty ?? 0} {selectedProduct?.unit}</span>
                <span className="font-mono text-red-600 font-semibold">
                  Kerugian HPP: Rp {estimatedLoss.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Kategori Penyebab */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Kategori Penyebab Kerusakan:
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                  reasonCategory === "PAPER_JAM"
                    ? "bg-amber-50 border-amber-400 text-amber-900 font-bold"
                    : "border-subtle hover:bg-neutral-50 text-ink"
                }`}>
                  <input
                    type="radio"
                    name="reason"
                    value="PAPER_JAM"
                    checked={reasonCategory === "PAPER_JAM"}
                    onChange={(e) => setReasonCategory(e.target.value)}
                    className="sr-only"
                  />
                  <Printer className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Kertas Nyangkut (Paper Jam)</span>
                </label>

                <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                  reasonCategory === "SALAH_PRINT"
                    ? "bg-amber-50 border-amber-400 text-amber-900 font-bold"
                    : "border-subtle hover:bg-neutral-50 text-ink"
                }`}>
                  <input
                    type="radio"
                    name="reason"
                    value="SALAH_PRINT"
                    checked={reasonCategory === "SALAH_PRINT"}
                    onChange={(e) => setReasonCategory(e.target.value)}
                    className="sr-only"
                  />
                  <FileX className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Salah Setting / Cetak</span>
                </label>

                <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                  reasonCategory === "BARANG_CACAT"
                    ? "bg-amber-50 border-amber-400 text-amber-900 font-bold"
                    : "border-subtle hover:bg-neutral-50 text-ink"
                }`}>
                  <input
                    type="radio"
                    name="reason"
                    value="BARANG_CACAT"
                    checked={reasonCategory === "BARANG_CACAT"}
                    onChange={(e) => setReasonCategory(e.target.value)}
                    className="sr-only"
                  />
                  <PackageX className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Bahan Cacat Produksi</span>
                </label>

                <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                  reasonCategory === "LAINNYA"
                    ? "bg-amber-50 border-amber-400 text-amber-900 font-bold"
                    : "border-subtle hover:bg-neutral-50 text-ink"
                }`}>
                  <input
                    type="radio"
                    name="reason"
                    value="LAINNYA"
                    checked={reasonCategory === "LAINNYA"}
                    onChange={(e) => setReasonCategory(e.target.value)}
                    className="sr-only"
                  />
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Alasan Lainnya</span>
                </label>
              </div>
            </div>

            {/* Keterangan Wajib */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Keterangan Detail Kejadian (Wajib):
              </label>
              <textarea
                rows={3}
                required
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Kertas terlipat saat masuk roller mesin cetak pada lembar ke-4..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-neutral-400"
              />
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !selectedProductId}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Mencatat Laporan..." : "Catat Barang Rusak (Kurangi Stok)"}</span>
            </button>
          </form>
        </div>

        {/* Kolom Kanan: Tabel Rekap Riwayat Rusak (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-subtle p-4 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-subtle pb-3 mb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-ink">Rekap Barang Rusak / Salah Print Shift Ini</h3>
            </div>
            <button
              onClick={fetchSpoilageList}
              disabled={isLoadingList}
              className="p-1 rounded-md border border-subtle hover:bg-neutral-100 text-ink-muted hover:text-ink transition-colors"
              title="Muat ulang riwayat"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[460px]">
            {isLoadingList ? (
              <div className="text-center py-12 text-xs text-ink-muted">
                Memuat riwayat barang rusak...
              </div>
            ) : spoilageList.length === 0 ? (
              <div className="text-center py-16 text-xs text-ink-muted border border-dashed border-subtle rounded-lg">
                Belum ada laporan barang rusak atau salah print pada shift ini. Pelayanan berjalan rapi!
              </div>
            ) : (
              spoilageList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-subtle bg-white hover:border-slate-300 transition-colors shadow-xs flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink">{item.product_name}</span>
                      <span className="font-mono text-[10px] text-ink-muted">({item.product_sku})</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-800 border border-red-200">
                        {item.reason_category}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-600 italic">
                      "{item.notes}"
                    </p>

                    <div className="text-[10px] text-neutral-400">
                      {new Date(item.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB • Dicatat oleh Admin
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-red-600 tabular-nums">
                      {item.qty_change} unit
                    </div>
                    <div className="text-[10px] font-mono text-ink-muted mt-0.5">
                      Rugi: Rp {(item.loss_value || 0).toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
