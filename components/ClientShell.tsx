"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { getCart, mergeGuestCart } from "@/actions/cart";
import { useCart } from "@/store/cart";
import { useToast } from "@/store/toast";
import { CheckIcon } from "./icons";

/** Keeps the cart store in step with the session (F8). */
function useCartSession() {
  const { data: session, status } = useSession();
  const uid = session?.user?.id ?? null;

  useEffect(() => {
    if (status === "loading") return;
    let cancelled = false;
    (async () => {
      if (!useCart.persist.hasHydrated()) await useCart.persist.rehydrate();
      const s = useCart.getState();
      try {
        if (uid && s.userId !== uid) {
          // Just signed in (or reloaded while signed in): fold any guest items into the DB cart.
          // Once userId is set, partialize stops persisting items, which clears the local guest cart.
          const guest = s.userId ? [] : s.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
          const items = guest.length ? await mergeGuestCart(guest) : await getCart();
          if (!cancelled) useCart.getState().setServerCart(uid, items);
        } else if (!uid && s.userId) {
          useCart.getState().setServerCart(null, []); // signed out: the DB cart stays in the DB
        }
      } finally {
        if (!cancelled) useCart.setState({ hydrated: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, uid]);
}

/** Session-aware cart sync, plus the "Added to cart" toast. */
export function ClientShell() {
  useCartSession();
  const toast = useToast((s) => s.toast);
  const dismiss = useToast((s) => s.dismiss);

  if (!toast) return null;
  return (
    <div
      role="status"
      key={toast.id}
      className="fixed bottom-4 left-1/2 z-50 flex w-[min(92vw,380px)] -translate-x-1/2 items-center gap-3 rounded-lg border border-amz-border bg-white p-3 shadow-xl [animation:toast-in_.18s_ease-out] md:left-auto md:right-4 md:translate-x-0"
    >
      {toast.image && (
        <Image src={toast.image} alt="" width={48} height={48} className="h-12 w-12 shrink-0 object-contain" />
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 font-bold text-amz-success">
          <CheckIcon className="h-4 w-4" /> {toast.title}
        </p>
        {toast.detail && <p className="truncate text-xs text-amz-muted">{toast.detail}</p>}
      </div>
      <Link
        href="/cart"
        onClick={dismiss}
        className="shrink-0 rounded-full border border-amz-border px-3 py-1 text-[13px] shadow-sm hover:bg-[#f7fafa]"
      >
        Go to Cart
      </Link>
    </div>
  );
}
