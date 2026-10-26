import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { cancelOrder, fulfilOrder, type CheckoutSource } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

/**
 * F10: Stripe calls this after payment. The signature is verified against the raw body, then the
 * order is fulfilled idempotently (see fulfilOrder). Anything verified gets a 200 so Stripe
 * doesn't retry events we've deliberately ignored.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });

  const signature = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature ?? "", secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      const source = (session.metadata?.source as CheckoutSource) ?? "cart";
      const result = await fulfilOrder(session.id, source);
      return NextResponse.json({ received: true, result });
    }
  } else if (event.type === "checkout.session.expired") {
    await cancelOrder(event.data.object.id);
  }
  return NextResponse.json({ received: true });
}
