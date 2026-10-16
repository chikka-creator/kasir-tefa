"use client";

import { create } from "zustand";
import { ShiftRecord } from "@/lib/shifts-data";

interface ShiftSummary {
  opening_cash: number;
  total_cash_sales: number;
  total_qris_sales: number;
  current_cash_in_drawer: number;
  total_transactions_count: number;
}

interface ShiftState {
  active: boolean;
  shift: ShiftRecord | null;
  summary: ShiftSummary | null;
  isLoading: boolean;
  error: string | null;
  fetchActiveShift: () => Promise<void>;
  setShiftData: (shift: ShiftRecord | null, summary: ShiftSummary | null) => void;
}

export const useShiftStore = create<ShiftState>()((set) => ({
  active: false,
  shift: null,
  summary: null,
  isLoading: false,
  error: null,

  fetchActiveShift: async () => {
    try {
      const res = await fetch("/api/shifts/active");
      const data = await res.json();

      if (data.active && data.shift) {
        set({
          active: true,
          shift: data.shift,
          summary: data.summary,
          isLoading: false,
        });
      } else {
        set({
          active: false,
          shift: null,
          summary: null,
          isLoading: false,
        });
      }
    } catch (err: unknown) {
      console.error("fetchActiveShift error:", err);
      set({
        error: "Gagal memuat sesi shift aktif",
        isLoading: false,
      });
    }
  },

  setShiftData: (shift, summary) => {
    set({
      active: !!shift,
      shift,
      summary,
      isLoading: false,
      error: null,
    });
  },
}));
