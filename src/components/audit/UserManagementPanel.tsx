"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  KeyRound,
  Shield,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
  Lock,
} from "lucide-react";

export interface UserItem {
  id: string;
  username: string;
  full_name: string;
  role: "ADMIN" | "TEACHER" | "AUDIT";
  is_active: boolean;
  has_pin?: boolean;
  created_at: string;
}

interface UserManagementPanelProps {
  users: UserItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function UserManagementPanel({
  users,
  isLoading,
  onRefresh,
}: UserManagementPanelProps) {
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<UserItem | null>(null);

  // Form states for creating user
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"ADMIN" | "TEACHER" | "AUDIT">("ADMIN");
  const [password, setPassword] = useState("");
  const [supervisorPin, setSupervisorPin] = useState("123456");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset credential form states
  const [newPassword, setNewPassword] = useState("");
  const [newPin, setNewPin] = useState("");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/audit/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          full_name: fullName,
          role,
          password,
          supervisor_pin: role === "TEACHER" ? supervisorPin : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat pengguna.");

      setFeedback({ type: "success", text: `Akun '${username}' berhasil dibuat.` });
      setIsCreateModalOpen(false);
      setUsername("");
      setFullName("");
      setPassword("");
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setFeedback({ type: "error", text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (userId: string, currentUsername: string) => {
    try {
      setFeedback(null);
      const res = await fetch(`/api/audit/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_ACTIVE" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah status.");

      setFeedback({ type: "success", text: `Status akun '${currentUsername}' berhasil diperbarui.` });
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setFeedback({ type: "error", text: msg });
    }
  };

  const handleResetCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    setFeedback(null);

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/audit/users/${resettingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESET_CREDENTIALS",
          new_password: newPassword || undefined,
          new_pin: newPin || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mereset kredensial.");

      setFeedback({ type: "success", text: `Kredensial akun '${resettingUser.username}' berhasil diubah.` });
      setResettingUser(null);
      setNewPassword("");
      setNewPin("");
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setFeedback({ type: "error", text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-subtle shadow-xs overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-subtle px-5 py-3.5 bg-neutral-50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs shadow-xs">
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-ink">Manajemen Pengguna Sistem TeFa</h2>
              <p className="text-[10px] text-ink-muted">
                Kontrol hak akses RBAC: Kasir Siswa (ADMIN), Guru Pembimbing (TEACHER), dan Audit (AUDIT)
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Akun Baru</span>
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className={`p-3 m-4 mb-0 rounded-lg text-xs flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}>
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="text-neutral-400 hover:text-ink">
              &times;
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead className="bg-neutral-50/80 border-b border-subtle text-[11px] font-semibold text-ink-muted">
              <tr>
                <th className="py-2.5 px-4">Username</th>
                <th className="py-2.5 px-4">Nama Lengkap</th>
                <th className="py-2.5 px-4">Role RBAC</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Fitur Tambahan</th>
                <th className="py-2.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-ink-muted">
                    Memuat daftar pengguna...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-ink">
                      @{u.username}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-ink">
                      {u.full_name}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        u.role === "AUDIT"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : u.role === "TEACHER"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-slate-100 text-slate-800 border-subtle"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      {u.is_active ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Aktif
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                          <XCircle className="w-2.5 h-2.5" />
                          Non-Aktif
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-[11px] text-ink-muted">
                      {u.role === "TEACHER" && (
                        <span className="flex items-center gap-1 font-mono text-[10px] text-amber-700">
                          <KeyRound className="w-3 h-3" />
                          PIN Supervisor Aktif
                        </span>
                      )}
                      {u.role === "ADMIN" && (
                        <span className="text-[10px] text-neutral-400">Multi-Perangkat POS</span>
                      )}
                      {u.role === "AUDIT" && (
                        <span className="text-[10px] text-blue-700">Full Access</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setResettingUser(u)}
                        className="px-2.5 py-1 rounded border border-subtle bg-white hover:bg-neutral-100 text-[11px] font-semibold text-ink shadow-2xs"
                      >
                        Reset Password
                      </button>

                      <button
                        onClick={() => handleToggleActive(u.id, u.username)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold shadow-2xs ${
                          u.is_active
                            ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {u.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah User */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl border border-subtle bg-white shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-subtle px-5 py-3.5 bg-neutral-50">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-ink">Tambah Akun Pengguna Baru</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-ink p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">Username Login:</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="Contoh: guru_budi atau kasir_shift2"
                  className="w-full px-3 py-2 rounded-lg border border-subtle focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Nama Lengkap & Gelar:</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Budi Santoso, S.Kom"
                  className="w-full px-3 py-2 rounded-lg border border-subtle focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Role / Peran Sistem:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-subtle focus:outline-none focus:ring-2 focus:ring-slate-900 text-ink bg-white"
                >
                  <option value="ADMIN">ADMIN (Kasir Siswa TeFa)</option>
                  <option value="TEACHER">TEACHER (Guru Pembimbing Supervisor)</option>
                  <option value="AUDIT">AUDIT (Kepala Unit / Pihak Sekolah)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Password Awal:</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  className="w-full px-3 py-2 rounded-lg border border-subtle focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {role === "TEACHER" && (
                <div>
                  <label className="block font-semibold text-ink mb-1">
                    PIN Supervisor 6-Digit (Khusus Guru):
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={supervisorPin}
                    onChange={(e) => setSupervisorPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full px-3 py-2 font-mono tracking-widest text-center rounded-lg border border-subtle focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <p className="text-[10px] text-ink-muted mt-1">*Untuk otorisasi void di kasir</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-subtle">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-subtle font-semibold text-ink hover:bg-neutral-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Buat Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Kredensial */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl border border-subtle bg-white shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-subtle px-5 py-3.5 bg-neutral-50">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-ink">
                  Reset Kredensial @{resettingUser.username}
                </h3>
              </div>
              <button
                onClick={() => setResettingUser(null)}
                className="text-neutral-400 hover:text-ink p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetCredentials} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">Password Baru (Opsional):</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Kosongkan bila tidak ingin mengubah password"
                  className="w-full px-3 py-2 rounded-lg border border-subtle focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {resettingUser.role === "TEACHER" && (
                <div>
                  <label className="block font-semibold text-ink mb-1">
                    PIN Supervisor Baru (6 Digit):
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="Kosongkan bila tidak ingin mengubah PIN"
                    className="w-full px-3 py-2 font-mono tracking-widest text-center rounded-lg border border-subtle focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-subtle">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-3.5 py-2 rounded-lg border border-subtle font-semibold text-ink hover:bg-neutral-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
