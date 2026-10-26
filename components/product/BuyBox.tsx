"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deliveryDate, deliveryDays } from "@/lib/format";
import { FREE_SHIPPING_MIN_CENTS, formatCents, SHIPPING_CENTS } from "@/lib/money";
import { MAX_QTY } from "@/store/cart";
import { LockIcon, PinIcon } from "../icons";
import { useAddToCart, type CartableProduct } from "./AddToCartButton";
import { PriceText } from "./Price";

/** F5 buy box: price, delivery, stock, quantity, Add to Cart, Buy Now (F13). */
export function BuyBox({ product }: { product: CartableProduct }) {
  const router = useRouter();
  const addToCart = useAddToCart();
  const [qty, setQty] = useState(1);
  const max = Math.min(MAX_QTY, product.stock);
  const out = product.stock <= 0;
  const free = product.priceCents >= FREE_SHIPPING_MIN_CENTS;
  const date = deliveryDate(deliveryDays(product.id));

  return (
    <div className="rounded-lg border border-amz-border p-[18px]">
      <PriceText cents={product.priceCents} size="md" />
      <p className="mt-2 text-sm">
        {free ? (
          <>
            <span className="text-amz-link">FREE delivery</span> <span className="font-bold">{date}</span>
          </>
        ) : (
          <>
            <span className="text-amz-link">{formatCents(SHIPPING_CENTS)} delivery</span> <span className="font-bold">{date}</span>. Or FREE
            delivery on orders over {formatCents(FREE_SHIPPING_MIN_CENTS)}
          </>
        )}
      </p>
      <p className="mt-2 flex items-center gap-1 text-xs text-amz-link">
        <PinIcon className="h-4 w-4 text-amz-text" /> Deliver to New York 10001
      </p>

      <p
        className={`mt-3 text-lg ${out ? "text-amz-price" : product.stock <= 5 ? "text-amz-price" : "text-amz-success"}`}
      >
        {out ? "Currently unavailable." : product.stock <= 5 ? `Only ${product.stock} left in stock - order soon.` : "In Stock"}
      </p>

      {!out && (
        <>
          <label className="mt-3 flex w-fit items-center gap-1 rounded-lg border border-[#d5d9d9] bg-[#f0f2f2] px-2.5 py-1 text-[13px] shadow-[0_2px_5px_rgba(15,17,17,.15)] hover:bg-[#e3e6e6]">
            Quantity:
            <select value={qty} onChange={(e) => setQty(Number(e.target.value))} className="cursor-pointer bg-transparent outline-none">
              {Array.from({ length: max }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-4 space-y-2.5">
            <button
              type="button"
              onClick={() => addToCart(product, qty)}
              className="h-[34px] w-full rounded-full bg-amz-yellow text-[13px] shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-amz-yellow-hover"
            >
              Add to Cart
            </button>
            <button
              type="button"
              onClick={() => router.push(`/checkout?buyNow=${product.id}&qty=${qty}`)}
              className="h-[34px] w-full rounded-full bg-amz-buy text-[13px] shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-amz-buy-hover"
            >
              Buy Now
            </button>
          </div>
        </>
      )}

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <dt className="text-amz-muted">Ships from</dt>
        <dd>Amazon.clone</dd>
        <dt className="text-amz-muted">Sold by</dt>
        <dd>Amazon.clone</dd>
        <dt className="text-amz-muted">Returns</dt>
        <dd className="text-amz-link">30-day refund / replacement</dd>
        <dt className="text-amz-muted">Payment</dt>
        <dd className="flex items-center gap-1 text-amz-link">
          <LockIcon className="h-3 w-3" /> Secure transaction
        </dd>
      </dl>
    </div>
  );
}
