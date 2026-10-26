import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CartRefresh, OrderPoller } from "@/components/checkout/OrderPoller";
import { CheckIcon } from "@/components/icons";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { fulfilOrder, orderNumber, type CheckoutSource } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = { title: "Thank you" };

type Props = { searchParams: Promise<{ session_id?: string }> };

/** F11: confirmation. Waits (up to ~10s) for the webhook; if it's late, asks Stripe directly. */
export default async function SuccessPage({ searchParams }: Props) {
  const sessionId = (await searchParams).session_id;
  const userId = (await auth())!.user.id;
  if (!sessionId) notFound();

  const find = () =>
    db.order.findFirst({
      where: { stripeSessionId: sessionId, userId },
      include: { items: true },
    });
  let order = await find();
  if (!order) notFound();

  if (order.status === "PENDING") {
    // Fallback for a slow or missing webhook: Stripe is the source of truth for "paid".
    const stripe = getStripe();
    const s = stripe ? await stripe.checkout.sessions.retrieve(sessionId).catch(() => null) : null;
    if (s?.payment_status === "paid") {
      await fulfilOrder(sessionId, (s.metadata?.source as CheckoutSource) ?? "cart");
      order = (await find())!;
    }
  }

  if (order.status !== "PAID") {
    return (
      <div className="mx-auto max-w-[700px] px-4 py-16 text-center">
        <OrderPoller />
        <h2 className="text-2xl">Confirming your payment…</h2>
        <p className="mt-2 text-sm text-amz-muted">This usually takes a few seconds. This page updates by itself.</p>
        <Link href="/orders" className="mt-6 inline-block text-sm text-amz-link hover:underline">
          Go to Your Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6">
      <CartRefresh />
      <div className="rounded-lg border border-amz-border p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-amz-success">
          <CheckIcon className="h-6 w-6" /> Order placed, thank you!
        </h2>
        <p className="mt-1 text-sm">Confirmation will be sent to your email. (Demo store: no email is actually sent.)</p>
        <p className="mt-3 text-sm">
          <span className="font-bold">Order #</span> {orderNumber(order.number)}
        </p>
        <p className="text-sm">
          <span className="font-bold">Shipping to</span> {order.shipName}, {order.shipLine1}, {order.shipCity}, {order.shipState} {order.shipZip}
        </p>
        <ul className="mt-4 space-y-3 border-t border-[#ddd] pt-4">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 text-sm">
              <Image src={i.imageSnapshot} alt="" width={60} height={60} className="h-[60px] w-[60px] object-contain" />
              <span className="flex-1">{i.titleSnapshot}</span>
              <span>Qty {i.quantity}</span>
              <span className="w-24 text-right font-bold">{formatCents(i.priceCentsSnapshot * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-[#ddd] pt-3 text-right text-lg font-bold text-amz-price">Order total: {formatCents(order.totalCents)}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/orders/${order.id}`} className="rounded-full bg-amz-yellow px-5 py-2 text-[13px] shadow-sm hover:bg-amz-yellow-hover">
            Review or edit your orders
          </Link>
          <Link href="/" className="rounded-full border border-amz-border px-5 py-2 text-[13px] shadow-sm hover:bg-[#f7fafa]">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
