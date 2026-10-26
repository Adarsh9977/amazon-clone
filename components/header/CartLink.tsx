"use client";

import Link from "next/link";
import { cartCount, useCart } from "@/store/cart";
import { CartIcon } from "../icons";

export function CartLink() {
  const count = useCart((s) => (s.hydrated ? cartCount(s.items) : 0));
  return (
    <Link
      href="/cart"
      aria-label={`${count} items in cart`}
      className="flex items-end rounded-sm border border-transparent px-1.5 py-1.5 hover:border-white"
    >
      <span className="relative">
        <CartIcon className="h-[30px] w-[38px]" />
        <span
          className={`absolute left-[15px] top-[-6px] w-[18px] text-center font-bold leading-none text-amz-orange ${
            count > 99 ? "text-[11px]" : "text-base"
          }`}
        >
          {count > 99 ? "99+" : count}
        </span>
      </span>
      <span className="hidden pb-0.5 text-sm font-bold md:inline">Cart</span>
    </Link>
  );
}
