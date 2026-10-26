"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setCartItem } from "@/actions/cart";

// Guest cart (F6) persisted to localStorage under amz-cart-v1. When signed in (F8) the DB
// cart is the source of truth: the store is an optimistic mirror and every change is sent
// to the setCartItem server action, whose result replaces the mirror.
// skipHydration + ClientShell's rehydrate() avoids a server/client mismatch on the header badge.

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
  /** True once the cart to display is known: guest storage read, and the DB cart loaded if signed in. */
  hydrated: boolean;
  /** Set when the items mirror a signed-in user's DB cart. */
  userId: string | null;
  add: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  setServerCart: (userId: string | null, items: CartItem[]) => void;
};

const cap = (q: number, stock: number) => Math.max(0, Math.min(q, stock, MAX_QTY));

export const useCart = create<CartState>()(
  persist(
    (set, get) => {
      let seq = 0; // only the latest response may replace the mirror, so a slow reply can't undo a newer change
      const sync = (productId: number) => {
        const { userId, items } = get();
        if (!userId) return;
        const quantity = items.find((i) => i.productId === productId)?.quantity ?? 0;
        const mine = ++seq;
        setCartItem(productId, quantity)
          .then((server) => mine === seq && get().userId === userId && set({ items: server }))
          .catch(() => {
            /* keep the optimistic state; the next page load re-reads the DB cart */
          });
      };
      return {
        items: [],
        hydrated: false,
        userId: null,
        add: (item, quantity) => {
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
          });
          sync(item.productId);
        },
        setQuantity: (productId, quantity) => {
          set((s) => ({
            items:
              quantity <= 0
                ? s.items.filter((i) => i.productId !== productId)
                : s.items.map((i) => (i.productId === productId ? { ...i, quantity: cap(quantity, i.stock) } : i)),
          }));
          sync(productId);
        },
        remove: (productId) => {
          set((s) => ({ items: s.items.filter((i) => i.productId !== productId) }));
          sync(productId);
        },
        clear: () => set({ items: [] }),
        setServerCart: (userId, items) => set({ userId, items }),
      };
    },
    {
      name: "amz-cart-v1",
      skipHydration: true,
      // Only the guest cart is stored locally; a signed-in cart lives in the DB.
      partialize: (s) => ({ items: s.userId ? [] : s.items }),
    },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity * i.priceCents, 0);
