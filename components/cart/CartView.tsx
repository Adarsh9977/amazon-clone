"use client";

import Image from "next/image";
import Link from "next/link";
import { FREE_SHIPPING_MIN_CENTS, formatCents } from "@/lib/money";
import { cartCount, cartSubtotal, MAX_QTY, useCart, type CartItem } from "@/store/cart";
import { CheckIcon } from "../icons";
import { PriceText } from "../product/Price";

function Line({ item }: { item: CartItem }) {
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const max = Math.min(MAX_QTY, item.stock);
  return (
    <li className="flex gap-3 border-b border-[#ddd] py-3 sm:gap-4">
      <Link href={`/dp/${item.slug}`} className="flex h-[100px] w-[100px] shrink-0 items-center justify-center sm:h-[180px] sm:w-[180px]">
        <Image src={item.image} alt="" width={180} height={180} className="h-full w-full object-contain" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-3">
          <Link href={`/dp/${item.slug}`} className="line-clamp-2 text-base leading-6 hover:text-amz-link-hover sm:text-lg">
            {item.title}
          </Link>
          <span className="hidden shrink-0 sm:block">
            <PriceText cents={item.priceCents} className="font-bold" />
          </span>
        </div>
        <span className="sm:hidden">
          <PriceText cents={item.priceCents} />
        </span>
        <p className={`text-xs ${item.stock <= 5 ? "text-amz-price" : "text-amz-success"}`}>
          {item.stock <= 5 ? `Only ${item.stock} left in stock - order soon.` : "In Stock"}
        </p>
        <p className="text-xs text-amz-muted">Eligible for FREE Shipping on orders over {formatCents(FREE_SHIPPING_MIN_CENTS)}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-1 rounded-lg border border-[#d5d9d9] bg-[#f0f2f2] px-2 py-1 shadow-[0_2px_5px_rgba(15,17,17,.15)] hover:bg-[#e3e6e6]">
            Qty:
            <select
              aria-label={`Quantity for ${item.title}`}
              value={item.quantity}
              onChange={(e) => setQuantity(item.productId, Number(e.target.value))}
              className="cursor-pointer bg-transparent outline-none"
            >
              <option value={0}>0 (Delete)</option>
              {Array.from({ length: max }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
          <span className="h-4 border-l border-[#ddd]" />
          <button type="button" onClick={() => remove(item.productId)} className="text-amz-link hover:underline">
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}

export function CartView() {
  const hydrated = useCart((s) => s.hydrated);
  const items = useCart((s) => s.items);
  const count = cartCount(items);
  const subtotal = cartSubtotal(items);
  const toFree = FREE_SHIPPING_MIN_CENTS - subtotal;

  if (!hydrated) {
    return <div className="mx-auto h-[400px] max-w-[1500px] animate-pulse bg-white p-5" aria-busy="true" />;
  }

  if (!items.length) {
    // Copy from the live site's empty cart (findings #12).
    return (
      <div className="mx-auto max-w-[1500px] p-3 md:p-5">
        <div className="flex flex-col gap-6 bg-white p-6 md:flex-row md:items-center">
          <svg viewBox="0 0 120 90" className="h-[120px] w-[160px] shrink-0" aria-hidden>
            <path d="M10 15h14l10 45h62l12-32H32" fill="none" stroke="#c4c4c4" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx="44" cy="75" r="6" fill="#c4c4c4" />
            <circle cx="88" cy="75" r="6" fill="#c4c4c4" />
          </svg>
          <div>
            <h1 className="text-[21px] font-bold leading-7">Your Amazon Cart is empty</h1>
            <Link href="/s?deals=1" className="text-sm text-amz-link hover:text-amz-link-hover hover:underline">
              Shop today&apos;s deals
            </Link>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/signin" className="rounded-full bg-amz-yellow px-4 py-1.5 text-[13px] shadow-sm hover:bg-amz-yellow-hover">
                Sign in to your account
              </Link>
              <Link href="/register" className="rounded-full border border-amz-border bg-white px-4 py-1.5 text-[13px] shadow-sm hover:bg-[#f7fafa]">
                Sign up now
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs text-amz-muted">
          Prices and availability can change. Your cart keeps each item&apos;s latest price; the final price is set at checkout.
        </p>
      </div>
    );
  }

  const checkout = (
    <div className="bg-white p-5">
      {toFree <= 0 ? (
        <p className="flex items-start gap-1.5 text-xs text-amz-success">
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Your order qualifies for FREE Shipping. <span className="text-amz-muted">Choose this option at checkout.</span>
          </span>
        </p>
      ) : (
        <p className="text-xs">
          Add <span className="font-bold text-amz-price">{formatCents(toFree)}</span> of eligible items to your order to qualify for FREE
          Shipping.
        </p>
      )}
      <p className="mt-3 text-lg">
        Subtotal ({count} {count === 1 ? "item" : "items"}): <span className="font-bold">{formatCents(subtotal)}</span>
      </p>
      <Link
        href="/signin?callbackUrl=%2Fcheckout"
        className="mt-3 flex h-[34px] w-full items-center justify-center rounded-full bg-amz-yellow text-[13px] shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-amz-yellow-hover"
      >
        Proceed to checkout
      </Link>
    </div>
  );

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-5 p-3 md:p-5 lg:flex-row lg:items-start">
      <div className="lg:hidden">{checkout}</div>
      <section className="min-w-0 flex-1 bg-white px-4 pb-4 pt-5 sm:px-5">
        <h1 className="text-[28px] leading-9">Shopping Cart</h1>
        <p className="mt-1 text-right text-sm text-amz-muted">Price</p>
        <ul className="border-t border-[#ddd]">
          {items.map((i) => (
            <Line key={i.productId} item={i} />
          ))}
        </ul>
        <p className="mt-2 text-right text-lg">
          Subtotal ({count} {count === 1 ? "item" : "items"}): <span className="font-bold">{formatCents(subtotal)}</span>
        </p>
      </section>
      <aside className="hidden w-[300px] shrink-0 lg:sticky lg:top-[115px] lg:block">{checkout}</aside>
    </div>
  );
}
