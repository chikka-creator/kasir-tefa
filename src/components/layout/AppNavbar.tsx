"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Printer, Shield, GraduationCap, UserCheck } from "lucide-react";
import { TerminalSwitcher } from "@/components/pos/TerminalSwitcher";

interface AppNavbarProps {
  user: {
    username: string;
    fullName: string;
    role: "ADMIN" | "TEACHER" | "AUDIT";
  };
  showTerminalSwitcher?: boolean;
}

export function AppNavbar({ user, showTerminalSwitcher = false }: AppNavbarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
      setIsLoggingOut(false);
    }
  };

  const getRoleBadge = () => {
    switch (user.role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <UserCheck className="w-3 h-3" />
            <span className="hidden sm:inline">ADMIN KASIR</span>
            <span className="sm:hidden">KASIR</span>
          </span>
        );
      case "TEACHER":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <GraduationCap className="w-3 h-3" />
            <span className="hidden sm:inline">GURU PEMBIMBING</span>
            <span className="sm:hidden">GURU</span>
          </span>
        );
      case "AUDIT":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Shield className="w-3 h-3" />
            <span className="hidden sm:inline">ROLE AUDIT</span>
            <span className="sm:hidden">AUDIT</span>
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-subtle bg-white px-2.5 sm:px-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Kiri: Logo & Info Sekolah + Terminal Switcher */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-sm shadow-sm shrink-0">
            <Printer className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-tight text-ink flex items-center gap-1.5">
              <span className="truncate max-w-[85px] sm:max-w-none">TEFA KASIR</span>
              <span className="hidden sm:inline-block text-[10px] font-normal px-1.5 py-0.2 rounded bg-neutral-100 text-ink-muted border border-subtle">
                v1.0
              </span>
            </div>
            <div className="text-[10px] text-ink-muted leading-none hidden sm:block">
              SMK Unit Produksi & Bisnis
            </div>
          </div>
        </div>

        {showTerminalSwitcher && (
          <div className="ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-subtle shrink-0">
            <TerminalSwitcher />
          </div>
        )}
      </div>

      {/* Kanan: Info Akun & Tombol Keluar */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <div className="text-right hidden md:block">
          <div className="text-xs font-semibold text-ink leading-tight">
            {user.fullName}
          </div>
          <div className="text-[11px] text-ink-muted">
            @{user.username}
          </div>
        </div>

        <div>{getRoleBadge()}</div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="ml-1 sm:ml-2 flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-md border border-subtle bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-xs font-medium text-ink-muted transition-colors disabled:opacity-50"
          title="Keluar dari sistem"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {isLoggingOut ? "Keluar..." : "Logout"}
          </span>
        </button>
      </div>
    </header>
  );
}
