"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TerminalId = "POS_1" | "POS_2";

interface PosTerminalState {
  terminalId: TerminalId;
  terminalName: string;
  setTerminalId: (id: TerminalId) => void;
}

export const usePosTerminalStore = create<PosTerminalState>()(
  persist(
    (set) => ({
      terminalId: "POS_1",
      terminalName: "Perangkat Kasir 1",
      setTerminalId: (id: TerminalId) =>
        set({
          terminalId: id,
          terminalName: id === "POS_1" ? "Perangkat Kasir 1" : "Perangkat Kasir 2",
        }),
    }),
    {
      name: "tefa_pos_terminal_identity",
    }
  )
);
