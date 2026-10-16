"use client";

import React, { useEffect, useState } from "react";
import { usePosTerminalStore, TerminalId } from "@/store/usePosTerminalStore";
import { Monitor, ChevronDown } from "lucide-react";

export function TerminalSwitcher() {
  const { terminalId, setTerminalId } = usePosTerminalStore();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-subtle bg-white text-xs font-medium text-ink-muted">
        <Monitor className="w-3.5 h-3.5 text-ink-muted" />
        <span>Memuat terminal...</span>
      </div>
    );
  }

  const handleSelect = (id: TerminalId) => {
    setTerminalId(id);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md border border-subtle bg-white hover:bg-neutral-50 shadow-sm text-xs font-semibold text-ink transition-colors"
        title="Klik untuk memilih identitas terminal perangkat kasir"
      >
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Monitor className="w-3.5 h-3.5 text-primary" />
        <span className="hidden sm:inline">
          {terminalId === "POS_1" ? "Perangkat Kasir 1 (POS_1)" : "Perangkat Kasir 2 (POS_2)"}
        </span>
        <span className="sm:hidden font-mono font-bold text-[11px]">
          {terminalId === "POS_1" ? "POS 1" : "POS 2"}
        </span>
        <ChevronDown className="w-3 h-3 text-ink-muted" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-1.5 w-60 rounded-md border border-subtle bg-white p-1 shadow-lg z-50 text-xs">
            <div className="px-2 py-1.5 text-[11px] font-semibold text-ink-muted border-b border-subtle mb-1">
              Pilih Identitas Perangkat Ini:
            </div>
            <button
              onClick={() => handleSelect("POS_1")}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-left transition-colors ${
                terminalId === "POS_1"
                  ? "bg-slate-900 text-white font-semibold"
                  : "hover:bg-neutral-100 text-ink"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[11px]">POS_1</span>
                <span>Perangkat Kasir 1</span>
              </div>
              {terminalId === "POS_1" && <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded">Aktif</span>}
            </button>
            <button
              onClick={() => handleSelect("POS_2")}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-left transition-colors mt-0.5 ${
                terminalId === "POS_2"
                  ? "bg-slate-900 text-white font-semibold"
                  : "hover:bg-neutral-100 text-ink"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[11px]">POS_2</span>
                <span>Perangkat Kasir 2</span>
              </div>
              {terminalId === "POS_2" && <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded">Aktif</span>}
            </button>
            <div className="mt-1 px-2 py-1 text-[10px] text-ink-muted bg-neutral-50 rounded">
              💡 1 Akun Admin berbagi 1 laci uang fisik bersama.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
