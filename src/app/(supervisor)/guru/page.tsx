"use client";

import React, { useEffect, useState } from "react";
import {
  GraduationCap,
  KeyRound,
  CheckSquare,
  ShieldAlert,
  Bell,
  RefreshCw,
  FileText,
  AlertTriangle,
  History,
  Layers,
  ArrowRight,
  Filter,
} from "lucide-react";
import { PendingShiftsList } from "@/components/supervisor/PendingShiftsList";
import { VoidQueuePanel, PendingVoidItem } from "@/components/supervisor/VoidQueuePanel";
import { ChangePinModal } from "@/components/supervisor/ChangePinModal";
import { EnrichedShiftItem } from "@/components/supervisor/VerifyShiftModal";

interface AuditLogItem {
  id: string;
  user_role: string;
  action_type: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  entity_name: string;
  description: string;
  created_at: string;
}

export default function GuruPage() {
  const [activeTab, setActiveTab] = useState<"SHIFTS" | "VOID" | "AUDIT">("SHIFTS");

  // Data states
  const [pendingShifts, setPendingShifts] = useState<EnrichedShiftItem[]>([]);
  const [pendingVoids, setPendingVoids] = useState<PendingVoidItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditFilter, setAuditFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch alerts & voids
      const alertsRes = await fetch("/api/supervisor/alerts");
      const alertsData = await alertsRes.json();
      setPendingVoids(alertsData.pending_voids || []);

      // Fetch pending shifts
      const shiftsRes = await fetch("/api/supervisor/pending-shifts");
      const shiftsData = await shiftsRes.json();
      setPendingShifts(shiftsData.pending_shifts || []);

      // Fetch audit logs
      const auditRes = await fetch("/api/audit-logs?take=25");
      const auditData = await auditRes.json();
      setAuditLogs(auditData.audit_logs || []);
    } catch (err) {
      console.error("fetchDashboardData error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filteredLogs = auditLogs.filter((log) => {
    if (auditFilter === "ALL") return true;
    return log.severity === auditFilter;
  });

  const warningCount = auditLogs.filter((l) => l.severity === "WARNING").length;

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-5 max-w-7xl w-full mx-auto space-y-4">
      {/* 1. Header Banner Supervisor */}
      <div className="bg-white rounded-xl border border-subtle p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-ink">Portal Guru Pembimbing TeFa</h1>
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                Supervisor
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Pusat pengawasan operasional kasir, otorisasi pembatalan transaksi (Dual Void), dan evaluasi penilaian shift siswa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* PIN Info & Button */}
          <div className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-lg border border-subtle text-xs">
            <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <div className="font-semibold text-ink text-[11px]">PIN Supervisor Aktif</div>
              <div className="text-[10px] text-ink-muted">Otorisasi Meja Kasir</div>
            </div>
            <button
              onClick={() => setIsPinModalOpen(true)}
              className="ml-2 px-2.5 py-1 rounded-md bg-white border border-subtle hover:bg-neutral-100 text-[11px] font-semibold text-ink shadow-2xs"
            >
              Ubah PIN
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="p-2 rounded-lg border border-subtle bg-white hover:bg-neutral-100 text-ink-muted hover:text-ink transition-colors shadow-2xs"
            title="Muat ulang data dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Kartu Alert & Metrik Supervisor */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Shift Menunggu Verifikasi */}
        <button
          onClick={() => setActiveTab("SHIFTS")}
          className={`p-4 rounded-xl border text-left transition-all shadow-xs flex items-center justify-between ${
            activeTab === "SHIFTS"
              ? "bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/20"
              : "bg-white border-subtle hover:border-amber-200"
          }`}
        >
          <div>
            <div className="text-[11px] font-semibold text-ink-muted uppercase">Verifikasi Tutup Shift</div>
            <div className="text-2xl font-bold font-mono text-ink mt-0.5">
              {pendingShifts.length}{" "}
              <span className="text-xs font-normal text-ink-muted">Shift</span>
            </div>
            <div className="text-[10px] text-ink-muted mt-1">
              {pendingShifts.length > 0 ? "Memerlukan skor & evaluasi guru" : "Semua shift telah diverifikasi"}
            </div>
          </div>
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${
            pendingShifts.length > 0 ? "bg-amber-500 text-white shadow-xs" : "bg-neutral-100 text-neutral-500"
          }`}>
            <CheckSquare className="w-5 h-5" />
          </div>
        </button>

        {/* Card 2: Permintaan Void Pending */}
        <button
          onClick={() => setActiveTab("VOID")}
          className={`p-4 rounded-xl border text-left transition-all shadow-xs flex items-center justify-between ${
            activeTab === "VOID"
              ? "bg-rose-50/60 border-rose-300 ring-2 ring-rose-400/20"
              : "bg-white border-subtle hover:border-rose-200"
          }`}
        >
          <div>
            <div className="text-[11px] font-semibold text-ink-muted uppercase">Antrean Void Kasir</div>
            <div className="text-2xl font-bold font-mono text-rose-700 mt-0.5">
              {pendingVoids.length}{" "}
              <span className="text-xs font-normal text-ink-muted">Pengajuan</span>
            </div>
            <div className="text-[10px] text-ink-muted mt-1">
              {pendingVoids.length > 0 ? "Menunggu persetujuan jarak jauh" : "Tidak ada antrean pending"}
            </div>
          </div>
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${
            pendingVoids.length > 0 ? "bg-rose-600 text-white shadow-xs animate-pulse" : "bg-neutral-100 text-neutral-500"
          }`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
        </button>

        {/* Card 3: Peringatan Harga & Stok (Audit Trail Fase 3) */}
        <button
          onClick={() => {
            setActiveTab("AUDIT");
            setAuditFilter("WARNING");
          }}
          className={`p-4 rounded-xl border text-left transition-all shadow-xs flex items-center justify-between ${
            activeTab === "AUDIT" && auditFilter === "WARNING"
              ? "bg-sky-50/60 border-sky-300 ring-2 ring-sky-400/20"
              : "bg-white border-subtle hover:border-sky-200"
          }`}
        >
          <div>
            <div className="text-[11px] font-semibold text-ink-muted uppercase">Perubahan Harga & Spoilage</div>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-0.5">
              {warningCount}{" "}
              <span className="text-xs font-normal text-ink-muted">Alert Log</span>
            </div>
            <div className="text-[10px] text-ink-muted mt-1">
              Tercatat rekam jejak WARNING
            </div>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* 3. Tab Kontrol Supervisor */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl border border-subtle bg-white shadow-xs overflow-x-auto text-xs font-semibold no-scrollbar">
        <button
          onClick={() => setActiveTab("SHIFTS")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTab === "SHIFTS"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-ink hover:bg-neutral-100"
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Verifikasi Tutup Shift & Penilaian ({pendingShifts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("VOID")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTab === "VOID"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-ink hover:bg-neutral-100"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          <span>Antrean Void Jarak Jauh ({pendingVoids.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("AUDIT")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTab === "AUDIT"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-ink hover:bg-neutral-100"
          }`}
        >
          <History className="w-3.5 h-3.5 text-sky-500" />
          <span>Log Audit & Mutasi Kasir ({auditLogs.length})</span>
        </button>
      </div>

      {/* 4. Tab Content Area */}
      {activeTab === "SHIFTS" && (
        <PendingShiftsList
          shifts={pendingShifts}
          isLoading={isLoading}
          onRefresh={fetchDashboardData}
        />
      )}

      {activeTab === "VOID" && (
        <VoidQueuePanel
          voidQueue={pendingVoids}
          isLoading={isLoading}
          onRefresh={fetchDashboardData}
        />
      )}

      {activeTab === "AUDIT" && (
        <div className="bg-white rounded-xl border border-subtle shadow-xs overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-subtle px-5 py-3.5 bg-neutral-50">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs shadow-xs">
                <History className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-ink">Rekam Jejak Aktivitas & Audit Kasir</h2>
                <p className="text-[10px] text-ink-muted">
                  Log keamanan, perubahan harga, mutasi restock, dan salah print (Zero-Trust)
                </p>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-ink-muted mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter:
              </span>
              {(["ALL", "WARNING", "INFO"] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setAuditFilter(sev)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    auditFilter === sev
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white border border-subtle text-ink-muted hover:bg-neutral-100"
                  }`}
                >
                  {sev === "ALL" ? "Semua Log" : sev === "WARNING" ? "Warning Saja" : "Info"}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-subtle text-[11px] font-semibold text-ink-muted">
                <tr>
                  <th className="py-2.5 px-4">Waktu</th>
                  <th className="py-2.5 px-4">Tingkat</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Aksi</th>
                  <th className="py-2.5 px-4">Deskripsi Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-ink-muted">
                      Tidak ada rekam jejak audit yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} WIB
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          log.severity === "WARNING"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : log.severity === "CRITICAL"
                            ? "bg-rose-100 text-rose-800 border-rose-300"
                            : "bg-neutral-100 text-neutral-700 border-subtle"
                        }`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-neutral-100 text-ink">
                          {log.user_role}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] font-semibold text-ink">
                        {log.action_type}
                      </td>
                      <td className="py-2.5 px-4 text-ink-muted text-[11px] max-w-md">
                        {log.description}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Ubah PIN */}
      <ChangePinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />
    </div>
  );
}
