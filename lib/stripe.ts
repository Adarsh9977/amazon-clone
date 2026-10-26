import Stripe from "stripe";

// Created lazily so builds and pages that don't pay still work without Stripe keys.
let client: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (key.startsWith("sk_live_")) throw new Error("Refusing to run with a live Stripe key: this project is test mode only.");
  client ??= new Stripe(key);
  return client;
}

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
