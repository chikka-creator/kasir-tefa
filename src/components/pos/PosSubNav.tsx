"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Package, AlertTriangle, History } from "lucide-react";

export function PosSubNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Layar Kasir POS",
      href: "/kasir",
      icon: ShoppingCart,
      isActive: pathname === "/kasir",
    },
    {
      label: "Katalog & Stok",
      href: "/kasir/katalog",
      icon: Package,
      isActive: pathname.startsWith("/kasir/katalog"),
    },
    {
      label: "Lapor Salah Print (Spoilage)",
      href: "/kasir/barang-rusak",
      icon: AlertTriangle,
      isActive: pathname.startsWith("/kasir/barang-rusak"),
      alertColor: "text-amber-600",
    },
    {
      label: "Riwayat Transaksi",
      href: "/kasir/riwayat",
      icon: History,
      isActive: pathname.startsWith("/kasir/riwayat"),
    },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-lg border border-subtle bg-white shadow-xs overflow-x-auto text-xs font-semibold">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
              item.isActive
                ? "bg-slate-900 text-white shadow-xs"
                : "text-ink hover:bg-neutral-100"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${item.isActive ? "text-white" : item.alertColor || "text-ink-muted"}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
