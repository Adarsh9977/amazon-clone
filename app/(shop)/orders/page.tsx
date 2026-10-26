import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { StatusChip } from "@/components/orders/StatusChip";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { orderNumber } from "@/lib/orders";

export const metadata: Metadata = { title: "Your Orders" };

const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

/** F11: newest first, scoped to the signed-in user. Middleware guarantees a session. */
export default async function OrdersPage() {
  const userId = (await auth())!.user.id;
  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="mx-auto max-w-[920px] px-4 py-5">
      <nav aria-label="Breadcrumb" className="mb-2 text-xs text-amz-muted">
        <Link href="/" className="text-amz-link hover:underline">
          Your Account
        </Link>{" "}
        › <span className="text-amz-link-hover">Your Orders</span>
      </nav>
      <h1 className="text-[28px] leading-9">Your Orders</h1>
      <p className="mt-1 text-sm">
        <span className="font-bold">{orders.length} orders</span> placed
      </p>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-lg border border-amz-border p-6 text-sm">
          <p>You haven&apos;t placed any orders yet.</p>
          <Link href="/s?deals=1" className="mt-2 inline-block text-amz-link hover:underline">
            Shop today&apos;s deals
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="overflow-hidden rounded-lg border border-amz-border">
              {/* Header strip: ORDER PLACED / TOTAL / SHIP TO / ORDER # */}
              <div className="flex flex-wrap gap-x-8 gap-y-2 border-b border-amz-border bg-[#f0f2f2] px-4 py-3 text-xs text-amz-muted">
                <div>
                  <p className="uppercase">Order placed</p>
                  <p className="text-sm text-amz-text">{fmtDate(o.createdAt)}</p>
                </div>
                <div>
                  <p className="uppercase">Total</p>
                  <p className="text-sm text-amz-text">{formatCents(o.totalCents)}</p>
                </div>
                <div>
                  <p className="uppercase">Ship to</p>
                  <p className="text-sm text-amz-link">{o.shipName}</p>
                </div>
                <div className="sm:ml-auto sm:text-right">
                  <p className="uppercase">Order # {orderNumber(o.number)}</p>
                  <Link href={`/orders/${o.id}`} className="text-sm text-amz-link hover:text-amz-link-hover hover:underline">
                    View order details
                  </Link>
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="mb-2 flex items-center gap-2">
                  <StatusChip status={o.status} />
                  {o.paidAt && <span className="text-xs text-amz-muted">Paid {fmtDate(o.paidAt)}</span>}
                </div>
                <ul className="space-y-3">
                  {o.items.map((i) => (
                    <li key={i.id} className="flex items-center gap-3">
                      <Image src={i.imageSnapshot} alt="" width={90} height={90} className="h-[90px] w-[90px] object-contain" />
                      <div className="text-sm">
                        <p className="line-clamp-2 text-amz-link">{i.titleSnapshot}</p>
                        <p className="text-amz-muted">
                          Qty {i.quantity} · {formatCents(i.priceCentsSnapshot)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
