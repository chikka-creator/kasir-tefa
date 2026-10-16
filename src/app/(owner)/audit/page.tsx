"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Shield,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  RotateCw,
  Lock,
  History,
  Users,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { ExecutiveAnalyticsCards } from "@/components/audit/ExecutiveAnalyticsCards";
import { FinalizeShiftsPanel } from "@/components/audit/FinalizeShiftsPanel";
import { ForensicLogExplorer } from "@/components/audit/ForensicLogExplorer";
import { UserManagementPanel, UserItem } from "@/components/audit/UserManagementPanel";
import { ShiftRecord } from "@/lib/shifts-data";
import { AuditLogRecord } from "@/lib/audit-logger";

export default function AuditPage() {
  const [activeTab, setActiveTab] = useState<"FINANCIAL" | "SHIFTS" | "LOGS" | "USERS">("FINANCIAL");
  const [analytics, setAnalytics] = useState<any>(null);
  const [verifiedShifts, setVerifiedShifts] = useState<ShiftRecord[]>([]);
  const [auditedShifts, setAuditedShifts] = useState<ShiftRecord[]>([]);
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resAnalytics, resLogs, resUsers] = await Promise.all([
        fetch("/api/audit/analytics"),
        fetch("/api/audit/logs?limit=100"),
        fetch("/api/audit/users"),
      ]);

      if (resAnalytics.ok) {
        const dataA = await resAnalytics.json();
        setAnalytics(dataA);
        setVerifiedShifts(dataA.verified_shifts || []);
        setAuditedShifts(dataA.audited_shifts || []);
      }

      if (resLogs.ok) {
        const dataL = await resLogs.json();
        setLogs(dataL.logs || []);
      }

      if (resUsers.ok) {
        const dataU = await resUsers.json();
        setUsers(dataU.users || []);
      }
    } catch (err: unknown) {
      console.error("Failed to load audit page data", err);
      setStatusMsg({
        type: "error",
        text: "Gagal memuat sebagian data audit.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handler for Excel Export (.xlsx)
  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      setStatusMsg(null);

      const res = await fetch("/api/reports/export");
      if (!res.ok) {
        throw new Error("Gagal mengunduh file Excel.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_Audit_TeFa_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatusMsg({
        type: "success",
        text: "Workbook Excel (.xlsx) 4-Sheet berhasil diunduh.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan export.";
      setStatusMsg({ type: "error", text: msg });
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-5">
      {/* 1. Header Banner Audit */}
      <div className="bg-white rounded-xl border border-subtle p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-ink">Dashboard Eksekutif & Audit Sekolah</h1>
              <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                Pihak Sekolah / Owner
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Transparansi laporan keuangan TeFa Percetakan, audit trail forensik harga & stok, serta finalisasi rekap nilai shift siswa.
            </p>
          </div>
        </div>

        {/* Quick Export & Refresh Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchAllData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-subtle bg-white hover:bg-neutral-50 text-ink text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Seluruh Data"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-600" : "text-ink-muted"}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className={`w-3.5 h-3.5 text-emerald-700 ${isExportingExcel ? "animate-bounce" : ""}`} />
            <span>{isExportingExcel ? "Menyiapkan..." : "Export Excel (.xlsx)"}</span>
          </button>

          <Link
            href="/audit/laporan-print"
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-subtle bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>Cetak PDF Resmi</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Status Alert Notification */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            statusMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-xs font-bold underline hover:opacity-75 cursor-pointer ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 2. Navigasi Tab Modern */}
      <div className="flex items-center gap-1.5 border-b border-subtle pb-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("FINANCIAL")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === "FINANCIAL"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-ink-muted hover:text-ink hover:bg-neutral-100"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Analisis Finansial & HPP</span>
        </button>

        <button
          onClick={() => setActiveTab("SHIFTS")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer relative whitespace-nowrap shrink-0 ${
            activeTab === "SHIFTS"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-ink-muted hover:text-ink hover:bg-neutral-100"
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Finalisasi Tutup Shift</span>
          {verifiedShifts.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
              {verifiedShifts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("LOGS")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === "LOGS"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-ink-muted hover:text-ink hover:bg-neutral-100"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Forensik (Append-Only)</span>
        </button>

        <button
          onClick={() => setActiveTab("USERS")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === "USERS"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-ink-muted hover:text-ink hover:bg-neutral-100"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Manajemen Akun & PIN</span>
        </button>
      </div>

      {/* 3. Konten Sesuai Tab Aktif */}
      <div className="space-y-6">
        {activeTab === "FINANCIAL" && (
          <>
            {isLoading && !analytics ? (
              <div className="py-20 text-center text-xs text-ink-muted flex flex-col items-center justify-center gap-2">
                <RotateCw className="w-5 h-5 animate-spin text-blue-600" />
                <span>Mengkalkulasi metrik finansial eksekutif...</span>
              </div>
            ) : analytics ? (
              <ExecutiveAnalyticsCards analytics={analytics} />
            ) : (
              <div className="p-8 text-center bg-white rounded-xl border border-subtle text-xs text-ink-muted">
                Tidak ada data transaksi yang dapat dianalisis.
              </div>
            )}
          </>
        )}

        {activeTab === "SHIFTS" && (
          <FinalizeShiftsPanel
            verifiedShifts={verifiedShifts}
            auditedShifts={auditedShifts}
            isLoading={isLoading}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === "LOGS" && (
          <ForensicLogExplorer
            logs={logs}
            isLoading={isLoading}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === "USERS" && (
          <UserManagementPanel
            users={users}
            isLoading={isLoading}
            onRefresh={fetchAllData}
          />
        )}
      </div>
    </div>
  );
}
