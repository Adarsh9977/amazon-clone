"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Guest cart (spec F6). Persisted to localStorage under amz-cart-v1.
// skipHydration + <CartHydrator/> avoids a server/client mismatch on the header badge.

export type CartItem = {
  productId: number;
  slug: string;
  title: string;
  image: string;
  priceCents: number;
  stock: number;
  quantity: number;
};

export const MAX_QTY = 10;

type CartState = {
  items: CartItem[];
  hydrated: boolean;
  add: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

const cap = (q: number, stock: number) => Math.max(0, Math.min(q, stock, MAX_QTY));

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      add: (item, quantity) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === item.productId ? { ...i, ...item, quantity: cap(i.quantity + quantity, item.stock) } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity: cap(quantity, item.stock) }] };
        }),
      setQuantity: (productId, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.productId !== productId)
              : s.items.map((i) => (i.productId === productId ? { ...i, quantity: cap(quantity, i.stock) } : i)),
        })),
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "amz-cart-v1",
      skipHydration: true,
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => () => useCart.setState({ hydrated: true }),
    },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity * i.priceCents, 0);
