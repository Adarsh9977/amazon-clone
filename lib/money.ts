// All money is integer cents (spec §4.4). Checkout totals are computed on the server from DB prices.

export const TAX_RATE = 0.08;
export const FREE_SHIPPING_MIN_CENTS = 3500;
export const SHIPPING_CENTS = 599;

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/** Splits a price into the three parts the live site typesets separately: $ · 24 · 99. */
export function priceParts(cents: number) {
  const dollars = Math.floor(cents / 100);
  return { whole: dollars.toLocaleString("en-US"), fraction: String(cents % 100).padStart(2, "0") };
}

export function discountPercent(priceCents: number, listPriceCents: number | null | undefined): number {
  if (!listPriceCents || listPriceCents <= priceCents) return 0;
  return Math.round(((listPriceCents - priceCents) / listPriceCents) * 100);
}

export function shippingFor(subtotalCents: number): number {
  return subtotalCents === 0 || subtotalCents >= FREE_SHIPPING_MIN_CENTS ? 0 : SHIPPING_CENTS;
}

export function totals(subtotalCents: number) {
  const shippingCents = shippingFor(subtotalCents);
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  return { subtotalCents, shippingCents, taxCents, totalCents: subtotalCents + shippingCents + taxCents };
}
