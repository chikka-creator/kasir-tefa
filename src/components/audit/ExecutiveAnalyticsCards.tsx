"use client";

import React from "react";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Coins,
  Scale,
  Banknote,
  CreditCard,
  Monitor,
  CheckCircle2,
} from "lucide-react";

interface AnalyticsProps {
  analytics: {
    kpi: {
      gross_revenue: number;
      total_cogs: number;
      total_spoilage_loss: number;
      net_profit: number;
      total_transactions: number;
      cash_accuracy_rate: number;
      net_variance: number;
      total_shifts_closed: number;
    };
    payment_breakdown: {
      cash: { amount: number; count: number };
      qris: { amount: number; count: number };
    };
    terminal_breakdown: {
      pos_1: { amount: number; count: number };
      pos_2: { amount: number; count: number };
    };
    category_breakdown: Array<{
      category: string;
      revenue: number;
      item_count: number;
    }>;
  };
}

export function ExecutiveAnalyticsCards({ analytics }: AnalyticsProps) {
  const { kpi, payment_breakdown, terminal_breakdown } = analytics;

  const totalPayments = (payment_breakdown.cash.amount || 0) + (payment_breakdown.qris.amount || 0);
  const cashPercent = totalPayments > 0 ? Math.round((payment_breakdown.cash.amount / totalPayments) * 100) : 50;
  const qrisPercent = 100 - cashPercent;

  const totalTerminals = (terminal_breakdown.pos_1.amount || 0) + (terminal_breakdown.pos_2.amount || 0);
  const pos1Percent = totalTerminals > 0 ? Math.round((terminal_breakdown.pos_1.amount / totalTerminals) * 100) : 50;
  const pos2Percent = 100 - pos1Percent;

  return (
    <div className="space-y-4">
      {/* 1. 4 Kartu KPI Keuangan Eksekutif */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Omzet Kotor */}
        <div className="p-4 rounded-xl border border-subtle bg-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Omzet Kotor</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-ink tabular-nums">
            Rp {kpi.gross_revenue.toLocaleString("id-ID")}
          </div>
          <div className="text-[10px] text-ink-muted mt-2 flex items-center justify-between border-t border-subtle pt-2">
            <span>Volume Transaksi:</span>
            <strong className="font-mono text-ink">{kpi.total_transactions} Lunas</strong>
          </div>
        </div>

        {/* KPI 2: Total HPP */}
        <div className="p-4 rounded-xl border border-subtle bg-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Modal HPP</span>
            <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-800 tabular-nums">
            Rp {kpi.total_cogs.toLocaleString("id-ID")}
          </div>
          <div className="text-[10px] text-ink-muted mt-2 flex items-center justify-between border-t border-subtle pt-2">
            <span>Beban Bahan & Kertas:</span>
            <span className="font-mono">
              {kpi.gross_revenue > 0 ? `${Math.round((kpi.total_cogs / kpi.gross_revenue) * 100)}% Omzet` : "0%"}
            </span>
          </div>
        </div>

        {/* KPI 3: Kerugian Salah Print / Spoilage */}
        <div className="p-4 rounded-xl border border-subtle bg-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Kerugian Salah Print</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-amber-700 tabular-nums">
            Rp {kpi.total_spoilage_loss.toLocaleString("id-ID")}
          </div>
          <div className="text-[10px] text-ink-muted mt-2 flex items-center justify-between border-t border-subtle pt-2">
            <span>Beban Spoilage Kasir:</span>
            <span className="font-mono text-amber-700 font-semibold">
              -Rp {kpi.total_spoilage_loss.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* KPI 4: Laba Bersih Riil */}
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-emerald-800 mb-2">
            <span className="font-bold uppercase tracking-wider text-[10px]">Laba Bersih Riil (Net Profit)</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-950 tabular-nums">
            Rp {kpi.net_profit.toLocaleString("id-ID")}
          </div>
          <div className="text-[10px] text-emerald-800 mt-2 flex items-center justify-between border-t border-emerald-200 pt-2 font-medium">
            <span>Net Profit Margin:</span>
            <span className="font-mono font-bold">
              {kpi.gross_revenue > 0 ? `${Math.round((kpi.net_profit / kpi.gross_revenue) * 100)}%` : "0%"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Visualisasi Breakdown Finansial & Operasional */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card Breakdown Metode Bayar */}
        <div className="p-4 rounded-xl border border-subtle bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-subtle pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>Metode Pembayaran</span>
            </div>
            <span className="text-[10px] font-mono text-ink-muted">Tunai vs QRIS</span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Cash */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-ink flex items-center gap-1 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Tunai (Cash):
                </span>
                <span className="font-mono font-bold text-ink">
                  Rp {payment_breakdown.cash.amount.toLocaleString("id-ID")} ({cashPercent}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${cashPercent}%` }}
                ></div>
              </div>
            </div>

            {/* QRIS */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-ink flex items-center gap-1 font-medium">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  QRIS Statis:
                </span>
                <span className="font-mono font-bold text-ink">
                  Rp {payment_breakdown.qris.amount.toLocaleString("id-ID")} ({qrisPercent}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${qrisPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Breakdown Performa Terminal POS 1 vs POS 2 */}
        <div className="p-4 rounded-xl border border-subtle bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-subtle pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <Monitor className="w-4 h-4 text-sky-600" />
              <span>Kontribusi Terminal Kasir</span>
            </div>
            <span className="text-[10px] font-mono text-ink-muted">POS_1 vs POS_2</span>
          </div>

          <div className="space-y-2 text-xs">
            {/* POS 1 */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-ink font-medium">Perangkat Kasir 1 (POS_1):</span>
                <span className="font-mono font-bold text-ink">
                  Rp {terminal_breakdown.pos_1.amount.toLocaleString("id-ID")} ({pos1Percent}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full bg-slate-800 rounded-full transition-all duration-500"
                  style={{ width: `${pos1Percent}%` }}
                ></div>
              </div>
            </div>

            {/* POS 2 */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-ink font-medium">Perangkat Kasir 2 (POS_2):</span>
                <span className="font-mono font-bold text-ink">
                  Rp {terminal_breakdown.pos_2.amount.toLocaleString("id-ID")} ({pos2Percent}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full bg-slate-600 rounded-full transition-all duration-500"
                  style={{ width: `${pos2Percent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Kesehatan Kas Fisik Laci */}
        <div className="p-4 rounded-xl border border-subtle bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-subtle pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <Scale className="w-4 h-4 text-indigo-600" />
              <span>Kesehatan Kas Fisik Laci</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              kpi.cash_accuracy_rate >= 90
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}>
              {kpi.cash_accuracy_rate}% Pas
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[11px]">
              <span className="text-ink-muted">Akurasi Rekonsiliasi:</span>
              <strong className="font-mono text-ink">{kpi.cash_accuracy_rate}% Sempurna</strong>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-ink-muted">Akumulasi Selisih Laci:</span>
              <strong className={`font-mono ${kpi.net_variance === 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {kpi.net_variance >= 0 ? `+Rp ${kpi.net_variance.toLocaleString("id-ID")}` : `-Rp ${Math.abs(kpi.net_variance).toLocaleString("id-ID")}`}
              </strong>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-ink-muted">Shift Telah Ditutup:</span>
              <strong className="font-mono text-ink">{kpi.total_shifts_closed} Sesi</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
