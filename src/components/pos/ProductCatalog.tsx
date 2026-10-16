"use client";

import React, { useState } from "react";
import { Search, Plus, X } from "lucide-react";
import { CartItem } from "@/store/usePosCartStore";

interface ProductCatalogProps {
  products: Array<Omit<CartItem, "qty">>;
  onAddToCart: (product: Omit<CartItem, "qty">) => void;
}

export function ProductCatalog({ products, onAddToCart }: ProductCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Extract unique category names
  const categories = ["ALL", ...Array.from(new Set(products.map((p) => p.category_name || "Lainnya")))];

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "ALL" || (p.category_name || "Lainnya") === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col bg-white rounded-xl border border-subtle shadow-xs overflow-hidden">
      {/* Top Search & Category Filter */}
      <div className="p-4 border-b border-subtle bg-white space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Cari nama layanan, cetak foto, jilid, atau ketik SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-xs rounded-lg border border-subtle bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-neutral-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-ink-muted hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const label = cat === "ALL" ? "Semua Kategori" : cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all text-xs ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-neutral-100 text-ink hover:bg-neutral-200 border border-transparent"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-28 lg:pb-4">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-xs font-semibold text-ink">Tidak ada produk yang cocok</p>
            <p className="text-[11px] text-ink-muted mt-1">
              Coba ganti kata kunci pencarian atau pilih kategori lain.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
            {filteredProducts.map((product) => {
              const isService = product.item_type === "SERVICE";
              const isOutOfStock = !isService && (product.stock_qty ?? 0) <= 0;

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && onAddToCart(product)}
                  className={`group relative p-2.5 sm:p-3 rounded-xl border text-left flex flex-col justify-between transition-all select-none ${
                    isOutOfStock
                      ? "opacity-60 bg-neutral-100 border-dashed border-neutral-300 cursor-not-allowed"
                      : "bg-white border-subtle hover:border-slate-800 hover:shadow-sm cursor-pointer active:scale-[0.98]"
                  }`}
                >
                  <div>
                    {/* Header SKU & Badge */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[9px] sm:text-[10px] font-mono text-ink-muted truncate">
                        {product.sku}
                      </span>
                      <span
                        className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                          isService
                            ? "bg-service-bg text-service border border-sky-200"
                            : "bg-goods-bg text-goods border border-indigo-200"
                        }`}
                      >
                        {isService ? "JASA" : "BARANG"}
                      </span>
                    </div>

                    {/* Name */}
                    <h4 className="text-xs font-bold text-ink leading-tight line-clamp-2 min-h-[2rem] group-hover:text-slate-900">
                      {product.name}
                    </h4>

                    {/* Category Label */}
                    <p className="text-[10px] text-ink-muted mt-0.5 truncate">
                      {product.category_name || "Percetakan"}
                    </p>
                  </div>

                  {/* Pricing & Stock Footer */}
                  <div className="mt-2 pt-1.5 sm:mt-3 sm:pt-2 border-t border-subtle flex items-end justify-between gap-1">
                    <div className="min-w-0">
                      <div className="text-[8px] sm:text-[9px] text-ink-muted">Harga:</div>
                      <div className="text-[11px] sm:text-xs font-bold font-mono text-ink tabular-nums truncate">
                        Rp {product.selling_price.toLocaleString("id-ID")}{" "}
                        <span className="text-[9px] sm:text-[10px] font-normal text-ink-muted">
                          /{product.unit}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!isOutOfStock && (
                        <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-neutral-100 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center text-ink transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
