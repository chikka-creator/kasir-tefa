"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  X,
  FileCode,
  Calendar,
  AlertTriangle,
  Info,
} from "lucide-react";
import { AuditLogRecord } from "@/lib/audit-logger";

interface ForensicLogExplorerProps {
  logs: AuditLogRecord[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function ForensicLogExplorer({ logs, isLoading, onRefresh }: ForensicLogExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === "" ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = severityFilter === "ALL" || log.severity === severityFilter;
    const matchesRole = roleFilter === "ALL" || log.user_role === roleFilter;

    return matchesSearch && matchesSeverity && matchesRole;
  });

  return (
    <>
      <div className="bg-white rounded-xl border border-subtle shadow-xs overflow-hidden">
        {/* Header & Filters */}
        <div className="p-4 border-b border-subtle bg-neutral-50 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs shadow-xs">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-ink">Eksplorasi Audit Log Forensik</h2>
                <p className="text-[10px] text-ink-muted">
                  Rekam jejak tidak dapat diubah (append-only) seluruh aktivitas sensitif sistem
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-white px-2.5 py-1 rounded-md border border-subtle text-ink">
              {filteredLogs.length} Log Ditemukan
            </span>
          </div>

          {/* Search & Filter pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-ink-muted" />
              <input
                type="text"
                placeholder="Cari aksi, entitas, deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-ink"
            >
              <option value="ALL">Semua Tingkat (Severity)</option>
              <option value="WARNING">WARNING (Peringatan Sensitif)</option>
              <option value="INFO">INFO (Operasional Normal)</option>
              <option value="CRITICAL">CRITICAL (Kritis)</option>
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-ink"
            >
              <option value="ALL">Semua Role Pengguna</option>
              <option value="ADMIN">ADMIN (Kasir Siswa)</option>
              <option value="TEACHER">TEACHER (Guru Pembimbing)</option>
              <option value="AUDIT">AUDIT (Kepala Unit/Sekolah)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-neutral-50/80 border-b border-subtle text-[11px] font-semibold text-ink-muted">
              <tr>
                <th className="py-2.5 px-4">Waktu (WIB)</th>
                <th className="py-2.5 px-4">Tingkat</th>
                <th className="py-2.5 px-4">Role / Terminal</th>
                <th className="py-2.5 px-4">Aksi</th>
                <th className="py-2.5 px-4">Deskripsi Aktivitas</th>
                <th className="py-2.5 px-4 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-ink-muted">
                    Memuat data audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-ink-muted">
                    Tidak ada catatan audit log yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })} WIB
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
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-neutral-100 text-ink mr-1">
                        {log.user_role}
                      </span>
                      {log.device_terminal && (
                        <span className="text-[10px] font-mono text-neutral-400">
                          {log.device_terminal}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-ink whitespace-nowrap">
                      {log.action_type}
                    </td>
                    <td className="py-2.5 px-4 text-ink-muted text-[11px] max-w-sm sm:max-w-md">
                      {log.description}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {(log.old_values || log.new_values) && (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2 py-1 rounded border border-subtle bg-white hover:bg-slate-900 hover:text-white text-[10px] font-semibold text-ink transition-colors"
                          title="Inspeksi Komparasi Data"
                        >
                          Forensik
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Inspeksi Forensik */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-xl border border-subtle bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-subtle px-5 py-3.5 bg-neutral-50">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-ink">
                  Inspeksi Forensik Log: <span className="font-mono">{selectedLog.action_type}</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-neutral-400 hover:text-ink p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-neutral-50 border border-subtle space-y-1">
                <div className="font-semibold text-ink">{selectedLog.description}</div>
                <div className="text-[11px] text-ink-muted flex items-center gap-2">
                  <span>Waktu: {new Date(selectedLog.created_at).toLocaleString("id-ID")}</span>
                  <span>• Entitas: {selectedLog.entity_name}</span>
                </div>
              </div>

              {/* Side by side JSON values */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Nilai Lama */}
                <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/30 space-y-1.5">
                  <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                    Nilai Sebelum (Old Values):
                  </div>
                  <pre className="p-2.5 rounded bg-white border border-rose-200 text-[10px] font-mono text-rose-950 overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.old_values, null, 2) || "{}"}
                  </pre>
                </div>

                {/* Nilai Baru */}
                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/30 space-y-1.5">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    Nilai Sesudah (New Values):
                  </div>
                  <pre className="p-2.5 rounded bg-white border border-emerald-200 text-[10px] font-mono text-emerald-950 overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.new_values, null, 2) || "{}"}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
