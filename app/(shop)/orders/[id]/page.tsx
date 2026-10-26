import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusChip } from "@/components/orders/StatusChip";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { orderNumber } from "@/lib/orders";

export const metadata: Metadata = { title: "Order Details" };

/** F11: full detail. Scoped by userId, so guessing another user's id is a 404. */
export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = (await auth())!.user.id;
  const order = await db.order.findFirst({
    where: { id: (await params).id, userId },
    include: { items: { include: { product: { select: { slug: true } } } } },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-[920px] px-4 py-5">
      <nav aria-label="Breadcrumb" className="mb-2 text-xs text-amz-muted">
        <Link href="/orders" className="text-amz-link hover:underline">
          Your Orders
        </Link>{" "}
        › <span className="text-amz-link-hover">Order Details</span>
      </nav>
      <h1 className="text-[28px] leading-9">Order Details</h1>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span>Ordered on {order.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
        <span className="text-[#ddd]">|</span>
        <span>Order # {orderNumber(order.number)}</span>
        <StatusChip status={order.status} />
      </p>

      <div className="mt-4 grid gap-6 rounded-lg border border-amz-border p-4 text-sm sm:grid-cols-3">
        <div>
          <h2 className="font-bold">Shipping Address</h2>
          <p>{order.shipName}</p>
          <p>{order.shipLine1}</p>
          {order.shipLine2 && <p>{order.shipLine2}</p>}
          <p>
            {order.shipCity}, {order.shipState} {order.shipZip}
          </p>
          <p>United States</p>
        </div>
        <div>
          <h2 className="font-bold">Payment Method</h2>
          <p>Card via Stripe (test mode)</p>
        </div>
        <div>
          <h2 className="font-bold">Order Summary</h2>
          <dl className="space-y-0.5">
            {[
              ["Item(s) Subtotal:", formatCents(order.subtotalCents)],
              ["Shipping & Handling:", order.shippingCents ? formatCents(order.shippingCents) : "FREE"],
              ["Estimated tax:", formatCents(order.taxCents)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
            <div className="flex justify-between pt-1 font-bold">
              <dt>Grand Total:</dt>
              <dd>{formatCents(order.totalCents)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <ul className="mt-4 space-y-4 rounded-lg border border-amz-border p-4">
        {order.items.map((i) => (
          <li key={i.id} className="flex items-center gap-4">
            <Image src={i.imageSnapshot} alt="" width={100} height={100} className="h-[100px] w-[100px] object-contain" />
            <div className="flex-1 text-sm">
              <Link href={`/dp/${i.product.slug}`} className="text-amz-link hover:text-amz-link-hover hover:underline">
                {i.titleSnapshot}
              </Link>
              <p className="text-amz-muted">Qty: {i.quantity}</p>
              <p className="font-bold text-amz-price">{formatCents(i.priceCentsSnapshot)}</p>
            </div>
            <Link
              href={`/dp/${i.product.slug}`}
              className="hidden rounded-full bg-amz-yellow px-4 py-1.5 text-[13px] shadow-sm hover:bg-amz-yellow-hover sm:block"
            >
              Buy it again
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
