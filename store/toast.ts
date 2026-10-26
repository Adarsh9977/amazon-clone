"use client";

import { create } from "zustand";

type Toast = { id: number; title: string; image?: string; detail?: string };

export const useToast = create<{ toast: Toast | null; show: (t: Omit<Toast, "id">) => void; dismiss: () => void }>()(
  (set) => ({
    toast: null,
    show: (t) => {
      const id = Date.now();
      set({ toast: { ...t, id } });
      setTimeout(() => set((s) => (s.toast?.id === id ? { toast: null } : s)), 3000);
    },
    dismiss: () => set({ toast: null }),
  }),
);
