"use client";

import React, { useEffect, useState } from "react";
import {
  Package,
  Plus,
  Edit2,
  PackagePlus,
  Search,
  RefreshCw,
  Layers,
  AlertTriangle,
  Boxes,
  Coins,
} from "lucide-react";
import { PosSubNav } from "@/components/pos/PosSubNav";
import { InventoryProduct } from "@/lib/inventory-data";
import { CreateProductModal } from "@/components/inventory/CreateProductModal";
import { EditProductModal } from "@/components/inventory/EditProductModal";
import { RestockModal } from "@/components/inventory/RestockModal";

export default function KatalogManagementPage() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);
  const [restockingProduct, setRestockingProduct] = useState<InventoryProduct | null>(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error("fetchProducts error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCat = categoryFilter === "ALL" || (p.category_name || "Lainnya") === categoryFilter;
    const matchesSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Calculate inventory statistics
  const totalServices = products.filter((p) => p.item_type === "SERVICE").length;
  const totalGoods = products.filter((p) => p.item_type === "GOODS").length;
  const totalAssetValue = products
    .filter((p) => p.item_type === "GOODS")
    .reduce((sum, p) => sum + p.cost_price * (p.stock_qty ?? 0), 0);
  const lowStockCount = products.filter(
    (p) => p.item_type === "GOODS" && (p.stock_qty ?? 0) < 15
  ).length;

  const categories = ["ALL", ...Array.from(new Set(products.map((p) => p.category_name || "Lainnya")))];

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 max-w-7xl w-full mx-auto space-y-4">
      {/* 1. Sub-Navigasi Tab Kasir */}
      <PosSubNav />

      {/* 2. Kartu Statistik Inventori */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-subtle bg-white shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold text-ink-muted uppercase">Layanan Jasa</div>
            <div className="text-lg font-bold font-mono text-sky-700 mt-0.5">
              {totalServices} <span className="text-xs font-normal text-ink-muted">Item</span>
            </div>
            <div className="text-[10px] text-ink-muted">Stok Tanpa Batas (∞)</div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-subtle bg-white shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold text-ink-muted uppercase">Barang Fisik</div>
            <div className="text-lg font-bold font-mono text-indigo-700 mt-0.5">
              {totalGoods} <span className="text-xs font-normal text-ink-muted">Item</span>
            </div>
            <div className="text-[10px] text-ink-muted">Mengurangi Stok Gudang</div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-subtle bg-white shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold text-ink-muted uppercase">Nilai Aset Modal</div>
            <div className="text-lg font-bold font-mono text-ink mt-0.5 tabular-nums">
              Rp {totalAssetValue.toLocaleString("id-ID")}
            </div>
            <div className="text-[10px] text-ink-muted">Total HPP Stok Tersedia</div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-subtle bg-white shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold text-ink-muted uppercase">Alert Stok Menipis</div>
            <div className={`text-lg font-bold font-mono mt-0.5 ${lowStockCount > 0 ? "text-amber-600" : "text-emerald-700"}`}>
              {lowStockCount} <span className="text-xs font-normal text-ink-muted">Barang</span>
            </div>
            <div className="text-[10px] text-ink-muted">Kuantitas di bawah 15 unit</div>
          </div>
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${lowStockCount > 0 ? "bg-amber-50 text-amber-600" : "bg-neutral-50 text-ink-muted"}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Panel Tabel Katalog & Aksi */}
      <div className="bg-white rounded-xl border border-subtle shadow-xs overflow-hidden flex flex-col">
        {/* Table Action Bar */}
        <div className="p-3.5 border-b border-subtle bg-neutral-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-ink-muted" />
              <input
                type="text"
                placeholder="Cari nama produk atau layanan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-ink"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "ALL" ? "Semua Kategori" : c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={fetchProducts}
              disabled={isLoading}
              className="p-1.5 rounded-lg border border-subtle bg-white hover:bg-neutral-100 text-ink-muted hover:text-ink transition-colors shadow-xs"
              title="Muat ulang katalog"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Produk Baru</span>
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-subtle bg-neutral-100/60 text-ink-muted font-bold text-[11px]">
                <th className="py-2.5 px-3">Nama Produk / Layanan</th>
                <th className="py-2.5 px-3">Tipe</th>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3 text-right">Harga Modal (HPP)</th>
                <th className="py-2.5 px-3 text-right">Harga Jual Kasir</th>
                <th className="py-2.5 px-3 text-center">Stok</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-ink-muted">
                    Memuat katalog produk & stok...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-ink-muted">
                    Tidak ada produk yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isService = p.item_type === "SERVICE";
                  const isLowStock = !isService && (p.stock_qty ?? 0) < 15;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-ink max-w-[240px]">
                        <div className="truncate">{p.name}</div>
                        <div className="text-[10px] font-normal text-ink-muted">Satuan: {p.unit}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isService
                              ? "bg-service-bg text-service border border-sky-200"
                              : "bg-goods-bg text-goods border border-indigo-200"
                          }`}
                        >
                          {isService ? "JASA" : "BARANG"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-ink-muted">
                        {p.category_name || "Umum"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-600">
                        Rp {p.cost_price.toLocaleString("id-ID")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-ink">
                        Rp {p.selling_price.toLocaleString("id-ID")}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isService ? (
                          <span className="text-[11px] font-medium text-neutral-400">∞</span>
                        ) : (
                          <span
                            className={`font-mono font-bold text-xs px-2 py-0.5 rounded tabular-nums ${
                              isLowStock
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : "bg-neutral-100 text-ink"
                            }`}
                          >
                            {p.stock_qty ?? 0}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="flex items-center gap-1 px-2 py-1 rounded border border-subtle bg-white hover:bg-neutral-100 text-[11px] font-semibold text-ink transition-colors shadow-xs"
                            title="Edit harga modal & harga jual"
                          >
                            <Edit2 className="w-3 h-3 text-ink-muted" />
                            <span>Edit</span>
                          </button>

                          {!isService && (
                            <button
                              onClick={() => setRestockingProduct(p)}
                              className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-semibold transition-colors shadow-xs"
                              title="Restock barang datang"
                            >
                              <PackagePlus className="w-3 h-3 text-emerald-600" />
                              <span>Restock</span>
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

      {/* Modals */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchProducts}
      />

      <EditProductModal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        product={editingProduct}
        onSuccess={fetchProducts}
      />

      <RestockModal
        isOpen={!!restockingProduct}
        onClose={() => setRestockingProduct(null)}
        product={restockingProduct}
        onSuccess={fetchProducts}
      />
    </div>
  );
}
