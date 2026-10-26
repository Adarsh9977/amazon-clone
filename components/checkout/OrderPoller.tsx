"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getCart } from "@/actions/cart";
import { useCart } from "@/store/cart";

/** Re-renders the server page every second, up to 10 tries, while the webhook lands (F11). */
export function OrderPoller() {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const t = setInterval(() => {
      if (++n > 10) return clearInterval(t);
      router.refresh();
    }, 1000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}

/** After payment the bought items left the DB cart; pull it so the header badge matches. */
export function CartRefresh() {
  useEffect(() => {
    const { userId, setServerCart } = useCart.getState();
    if (userId) getCart().then((items) => setServerCart(userId, items)).catch(() => {});
  }, []);
  return null;
}
