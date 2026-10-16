"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TerminalId } from "./usePosTerminalStore";

export interface CartItem {
  id: string; // product id
  sku: string;
  name: string;
  item_type: "SERVICE" | "GOODS";
  selling_price: number;
  cost_price: number;
  stock_qty: number | null;
  unit: string;
  category_name?: string;
  qty: number;
}

interface PosCartState {
  // Keranjang belanja terpisah per terminal ID: POS_1 dan POS_2
  carts: {
    POS_1: CartItem[];
    POS_2: CartItem[];
  };
  addItem: (terminalId: TerminalId, product: Omit<CartItem, "qty">, initialQty?: number) => void;
  updateQty: (terminalId: TerminalId, productId: string, qty: number) => void;
  removeItem: (terminalId: TerminalId, productId: string) => void;
  clearCart: (terminalId: TerminalId) => void;
  getCartItems: (terminalId: TerminalId) => CartItem[];
  getTotalAmount: (terminalId: TerminalId) => number;
  getTotalItemsCount: (terminalId: TerminalId) => number;
  getTotalUnitsCount: (terminalId: TerminalId) => number;
}

export const usePosCartStore = create<PosCartState>()(
  persist(
    (set, get) => ({
      carts: {
        POS_1: [],
        POS_2: [],
      },

      addItem: (terminalId, product, initialQty = 1) => {
        set((state) => {
          const currentCart = state.carts[terminalId] || [];
          const existingIndex = currentCart.findIndex((item) => item.id === product.id);

          let updatedCart: CartItem[];
          if (existingIndex > -1) {
            updatedCart = currentCart.map((item, index) => {
              if (index === existingIndex) {
                const newQty = item.qty + initialQty;
                // Jika GOODS dan ada stok terbatas, batasi kuantitas
                const maxQty = item.stock_qty !== null ? Math.min(newQty, item.stock_qty) : newQty;
                return { ...item, qty: maxQty > 0 ? maxQty : 1 };
              }
              return item;
            });
          } else {
            const safeQty = product.stock_qty !== null ? Math.min(initialQty, product.stock_qty) : initialQty;
            updatedCart = [
              ...currentCart,
              {
                ...product,
                qty: safeQty > 0 ? safeQty : 1,
              },
            ];
          }

          return {
            carts: {
              ...state.carts,
              [terminalId]: updatedCart,
            },
          };
        });
      },

      updateQty: (terminalId, productId, qty) => {
        set((state) => {
          const currentCart = state.carts[terminalId] || [];
          if (qty <= 0) {
            return {
              carts: {
                ...state.carts,
                [terminalId]: currentCart.filter((item) => item.id !== productId),
              },
            };
          }

          const updatedCart = currentCart.map((item) => {
            if (item.id === productId) {
              const maxQty = item.stock_qty !== null ? Math.min(qty, item.stock_qty) : qty;
              return { ...item, qty: Math.max(1, maxQty) };
            }
            return item;
          });

          return {
            carts: {
              ...state.carts,
              [terminalId]: updatedCart,
            },
          };
        });
      },

      removeItem: (terminalId, productId) => {
        set((state) => {
          const currentCart = state.carts[terminalId] || [];
          return {
            carts: {
              ...state.carts,
              [terminalId]: currentCart.filter((item) => item.id !== productId),
            },
          };
        });
      },

      clearCart: (terminalId) => {
        set((state) => ({
          carts: {
            ...state.carts,
            [terminalId]: [],
          },
        }));
      },

      getCartItems: (terminalId) => {
        return get().carts[terminalId] || [];
      },

      getTotalAmount: (terminalId) => {
        const items = get().carts[terminalId] || [];
        return items.reduce((sum, item) => sum + item.selling_price * item.qty, 0);
      },

      getTotalItemsCount: (terminalId) => {
        const items = get().carts[terminalId] || [];
        return items.length;
      },

      getTotalUnitsCount: (terminalId) => {
        const items = get().carts[terminalId] || [];
        return items.reduce((sum, item) => sum + item.qty, 0);
      },
    }),
    {
      name: "tefa_pos_carts_multi_terminal",
    }
  )
);
