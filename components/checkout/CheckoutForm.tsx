"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { addressSchema, US_STATES, type AddressErrors } from "@/lib/address";
import { deliveryDate } from "@/lib/format";
import { formatCents } from "@/lib/money";
import type { CheckoutLine } from "@/lib/orders";
import { FieldError } from "../auth/fields";
import { LockIcon } from "../icons";

type Totals = { subtotalCents: number; shippingCents: number; taxCents: number; totalCents: number };

const input =
  "h-[31px] w-full rounded-[3px] border border-[#a6a6a6] border-t-[#949494] px-2 text-[13px] outline-none focus:border-[#e77600] focus:shadow-[0_0_3px_2px_rgba(228,121,17,.5)] aria-[invalid=true]:border-amz-deal";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-[#ddd] py-4">
      <h2 className="flex gap-4 text-lg font-bold">
        <span className="w-4">{n}</span> {title}
      </h2>
      <div className="mt-3 md:pl-8">{children}</div>
    </section>
  );
}

/** F9: address (Zod on client and server), payment note, review items, sticky order summary. */
export function CheckoutForm({
  lines,
  totals: t,
  buyNow,
  problem,
  defaultName,
  stripeReady,
}: {
  lines: CheckoutLine[];
  totals: Totals;
  buyNow?: { productId: number; quantity: number };
  problem: string | null;
  defaultName: string;
  stripeReady: boolean;
}) {
  const [addr, setAddr] = useState({ name: defaultName, line1: "", line2: "", city: "", state: "", zip: "" });
  const [errors, setErrors] = useState<AddressErrors>({});
  const [error, setError] = useState<string | null>(problem);
  const [pending, start] = useTransition();
  const count = lines.reduce((n, l) => n + l.quantity, 0);

  const bind = (key: keyof typeof addr) => ({
    id: `addr-${key}`,
    value: addr[key],
    "aria-invalid": !!errors[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setAddr((a) => ({ ...a, [key]: e.target.value }));
      setErrors((x) => ({ ...x, [key]: undefined }));
    },
  });

  function placeOrder() {
    const parsed = addressSchema.safeParse(addr);
    if (!parsed.success) {
      const next: AddressErrors = {};
      for (const i of parsed.error.issues) next[i.path[0] as keyof AddressErrors] ??= i.message;
      setErrors(next);
      document.getElementById(`addr-${Object.keys(next)[0]}`)?.focus();
      return;
    }
    start(async () => {
      setError(null);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: parsed.data, buyNow }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.assign(data.url); // Stripe-hosted payment page
        return;
      }
      if (data.errors) setErrors(data.errors);
      setError(data.error ?? "Something went wrong. Please try again.");
    });
  }

  const summary = (
    <div className="rounded-lg border border-amz-border p-4">
      <button
        type="button"
        onClick={placeOrder}
        disabled={pending || !!problem}
        className="h-[34px] w-full rounded-full bg-amz-yellow text-[13px] shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-amz-yellow-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Redirecting to payment…" : "Place your order"}
      </button>
      <p className="mt-2 text-center text-[11px] leading-4 text-amz-muted">
        By placing your order you agree this is a demo store and no real payment is taken.
      </p>
      <hr className="my-3 border-[#ddd]" />
      <h3 className="text-lg font-bold">Order Summary</h3>
      <dl className="mt-1 space-y-1 text-xs">
        <div className="flex justify-between">
          <dt>Items ({count}):</dt>
          <dd>{formatCents(t.subtotalCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Shipping &amp; handling:</dt>
          <dd>{t.shippingCents ? formatCents(t.shippingCents) : "FREE"}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Estimated tax (8%):</dt>
          <dd>{formatCents(t.taxCents)}</dd>
        </div>
      </dl>
      <hr className="my-2 border-[#ddd]" />
      <p className="flex justify-between text-lg font-bold text-amz-price">
        <span>Order total:</span>
        <span>{formatCents(t.totalCents)}</span>
      </p>
    </div>
  );

  return (
    <div className="mx-auto flex max-w-[1150px] flex-col gap-6 px-4 py-4 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        {error && (
          <div role="alert" className="mb-3 rounded-lg border border-amz-deal bg-[#fff5f6] p-3 text-sm text-amz-deal">
            {error}{" "}
            {problem && (
              <Link href="/cart" className="text-amz-link underline">
                Review your cart
              </Link>
            )}
          </div>
        )}
        {!stripeReady && (
          <div className="mb-3 rounded-lg border border-[#e7a71b] bg-[#fffbf0] p-3 text-sm">
            Payments aren&apos;t configured on this deployment, so placing an order will fail. Add Stripe test keys to enable it.
          </div>
        )}

        <Step n={1} title="Shipping address">
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              placeOrder();
            }}
            className="grid max-w-[520px] grid-cols-2 gap-x-3 gap-y-3"
          >
            <div className="col-span-2">
              <label htmlFor="addr-name" className="mb-1 block text-[13px] font-bold">
                Full name
              </label>
              <input autoComplete="name" className={input} {...bind("name")} />
              <FieldError>{errors.name}</FieldError>
            </div>
            <div className="col-span-2">
              <label htmlFor="addr-line1" className="mb-1 block text-[13px] font-bold">
                Address
              </label>
              <input autoComplete="address-line1" placeholder="Street address or P.O. Box" className={input} {...bind("line1")} />
              <FieldError>{errors.line1}</FieldError>
              <input
                autoComplete="address-line2"
                placeholder="Apt, suite, unit, building, floor, etc."
                aria-label="Address line 2"
                className={`${input} mt-2`}
                {...bind("line2")}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="addr-city" className="mb-1 block text-[13px] font-bold">
                City
              </label>
              <input autoComplete="address-level2" className={input} {...bind("city")} />
              <FieldError>{errors.city}</FieldError>
            </div>
            <div>
              <label htmlFor="addr-state" className="mb-1 block text-[13px] font-bold">
                State
              </label>
              <select autoComplete="address-level1" className={`${input} bg-[#f0f2f2]`} {...bind("state")}>
                <option value="">Select</option>
                {US_STATES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
              <FieldError>{errors.state}</FieldError>
            </div>
            <div>
              <label htmlFor="addr-zip" className="mb-1 block text-[13px] font-bold">
                ZIP Code
              </label>
              <input autoComplete="postal-code" inputMode="numeric" className={input} {...bind("zip")} />
              <FieldError>{errors.zip}</FieldError>
            </div>
            <button type="submit" hidden />
          </form>
        </Step>

        <Step n={2} title="Payment method">
          <p className="flex items-center gap-2 text-sm">
            <LockIcon className="h-4 w-4 text-amz-muted" /> You&apos;ll enter card details securely on the next page.
          </p>
          <p className="mt-1 text-xs text-amz-muted">Stripe test mode: use card 4242 4242 4242 4242, any future date, any CVC.</p>
        </Step>

        <Step n={3} title="Review items and shipping">
          <div className="rounded-lg border border-amz-border p-4">
            <p className="text-lg font-bold text-amz-success">Arriving {deliveryDate(4)}</p>
            <ul className="mt-3 space-y-4">
              {lines.map((l) => (
                <li key={l.productId} className="flex gap-3">
                  <Image src={l.image} alt="" width={80} height={80} className="h-20 w-20 shrink-0 object-contain" />
                  <div className="text-sm">
                    <p className="font-bold">{l.title}</p>
                    <p className="font-bold text-amz-price">{formatCents(l.priceCents)}</p>
                    <p>Qty: {l.quantity}</p>
                    {l.quantity > l.stock && <p className="text-amz-deal">Only {l.stock} left in stock</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Step>

        <div className="mt-4 hidden items-center gap-4 rounded-lg border border-amz-border p-4 lg:flex">
          <button
            type="button"
            onClick={placeOrder}
            disabled={pending || !!problem}
            className="h-[34px] shrink-0 rounded-full bg-amz-yellow px-5 text-[13px] shadow-sm hover:bg-amz-yellow-hover disabled:opacity-60"
          >
            Place your order
          </button>
          <p className="text-lg font-bold text-amz-price">Order total: {formatCents(t.totalCents)}</p>
        </div>
      </div>
      <aside className="w-full lg:sticky lg:top-4 lg:w-[290px]">{summary}</aside>
    </div>
  );
}
