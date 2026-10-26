import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { addressSchema } from "@/lib/address";
import { auth } from "@/lib/auth";
import { checkoutLines, createPendingOrder, lineProblem, orderTotals, type CheckoutSource } from "@/lib/orders";
import { appUrl, getStripe } from "@/lib/stripe";

const body = z.object({
  address: addressSchema,
  buyNow: z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(10) }).optional(),
});

/** F9: price from the DB, create a PENDING order and a Stripe Checkout Session, return its URL. */
export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return NextResponse.json({ error: "Please sign in to check out." }, { status: 401 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0] === "address" && i.path[1]) errors[String(i.path[1])] ??= i.message;
    return NextResponse.json({ error: "Please check your address.", errors }, { status: 400 });
  }
  const { address, buyNow } = parsed.data;
  const source: CheckoutSource = buyNow ? "buynow" : "cart";

  const lines = await checkoutLines(user.id, buyNow);
  const problem = lineProblem(lines);
  if (problem) return NextResponse.json({ error: problem }, { status: 409 });

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Payments aren't configured on this deployment (missing STRIPE_SECRET_KEY)." }, { status: 503 });
  }

  const t = orderTotals(lines);
  const orderId = randomUUID();
  const base = appUrl(req.nextUrl.origin);
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email ?? undefined,
    line_items: [
      ...lines.map((l) => ({
        quantity: l.quantity,
        price_data: {
          currency: "usd",
          unit_amount: l.priceCents,
          product_data: { name: l.title, images: [l.image] },
        },
      })),
      {
        quantity: 1,
        price_data: { currency: "usd", unit_amount: t.taxCents, product_data: { name: "Estimated tax (8%)" } },
      },
    ],
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: t.shippingCents ? "Standard Shipping" : "FREE Shipping",
          fixed_amount: { amount: t.shippingCents, currency: "usd" },
        },
      },
    ],
    metadata: { orderId, source },
    payment_intent_data: { metadata: { orderId } },
    success_url: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/cart`,
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60, // Stripe's minimum is 30 minutes
  });

  await createPendingOrder({ id: orderId, userId: user.id, stripeSessionId: checkout.id, lines, address });
  return NextResponse.json({ url: checkout.url });
}
