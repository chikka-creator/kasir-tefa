"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, Shield, GraduationCap, UserCheck, ArrowRight, Lock, User, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal melakukan autentikasi");
      }

      router.push(data.redirectUrl || "/kasir");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan sistem saat login.");
      }
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md mb-3 border border-slate-800">
            <Printer className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Sistem Kasir TeFa Percetakan
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Unit Produksi & Bisnis Percetakan & Fotocopy Siswa SMK
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-xl border border-subtle p-6 sm:p-8 shadow-sm">
          <div className="mb-5 border-b border-subtle pb-4">
            <h2 className="text-base font-semibold text-ink">Masuk ke Sistem</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Silakan login dengan akun Admin Kasir, Guru Pembimbing, atau Audit Sekolah.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: kasir_tefa"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-subtle bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-neutral-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-subtle bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-neutral-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white py-2.5 text-sm font-semibold shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{isLoading ? "Memproses Autentikasi..." : "Masuk ke Aplikasi"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-5 border-t border-subtle">
            <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2.5">
              Pilihan Akun Demo Cepat (1-Klik):
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials("kasir_tefa", "kasir123")}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-subtle bg-neutral-50 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-900 transition-colors text-center group"
              >
                <UserCheck className="w-4 h-4 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-ink">Kasir Siswa</span>
                <span className="text-[9px] text-ink-muted">Shared POS</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials("guru_tefa", "guru123")}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-subtle bg-neutral-50 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-900 transition-colors text-center group"
              >
                <GraduationCap className="w-4 h-4 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-ink">Guru TeFa</span>
                <span className="text-[9px] text-ink-muted">PIN 123456</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials("audit_sekolah", "audit123")}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-subtle bg-neutral-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-900 transition-colors text-center group"
              >
                <Shield className="w-4 h-4 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-ink">Tim Audit</span>
                <span className="text-[9px] text-ink-muted">Kepala/Owner</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-5 text-[11px] text-ink-muted">
          <span>&copy; {new Date().getFullYear()} Unit Produksi & Bisnis SMK • Sistem Kasir TeFa</span>
        </div>
      </div>
    </div>
  );
}
