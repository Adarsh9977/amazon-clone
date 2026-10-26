import type { Address } from "./address";
import { db } from "./db";
import { totals } from "./money";

export type CheckoutSource = "cart" | "buynow";

export type CheckoutLine = {
  productId: number;
  slug: string;
  title: string;
  image: string;
  priceCents: number;
  stock: number;
  quantity: number;
};

const lineSelect = { id: true, slug: true, title: true, thumbnail: true, priceCents: true, stock: true } as const;

/**
 * What's being bought, priced from the DB (never the client). Buy Now (F13) is a single
 * line built from ?buyNow=&qty= and doesn't touch the cart.
 */
export async function checkoutLines(userId: string, buyNow?: { productId: number; quantity: number }): Promise<CheckoutLine[]> {
  if (buyNow) {
    const p = await db.product.findUnique({ where: { id: buyNow.productId }, select: lineSelect });
    if (!p) return [];
    return [{ productId: p.id, slug: p.slug, title: p.title, image: p.thumbnail, priceCents: p.priceCents, stock: p.stock, quantity: buyNow.quantity }];
  }
  const cart = await db.cart.findUnique({
    where: { userId },
    select: { items: { orderBy: { id: "asc" }, select: { quantity: true, product: { select: lineSelect } } } },
  });
  return (cart?.items ?? []).map(({ quantity, product: p }) => ({
    productId: p.id,
    slug: p.slug,
    title: p.title,
    image: p.thumbnail,
    priceCents: p.priceCents,
    stock: p.stock,
    quantity,
  }));
}

/** Null when the lines can be bought, otherwise a message for the shopper. */
export function lineProblem(lines: CheckoutLine[]): string | null {
  if (!lines.length) return "Your cart is empty.";
  const short = lines.find((l) => l.quantity > l.stock);
  if (short) return short.stock <= 0 ? `${short.title} is out of stock.` : `Only ${short.stock} of ${short.title} left in stock.`;
  return null;
}

export function orderTotals(lines: CheckoutLine[]) {
  return totals(lines.reduce((n, l) => n + l.priceCents * l.quantity, 0));
}

/** Order + item snapshots, created as PENDING before the shopper is sent to Stripe. */
export async function createPendingOrder(args: {
  id: string;
  userId: string;
  stripeSessionId: string;
  lines: CheckoutLine[];
  address: Address;
}) {
  const t = orderTotals(args.lines);
  return db.order.create({
    data: {
      id: args.id,
      userId: args.userId,
      stripeSessionId: args.stripeSessionId,
      status: "PENDING",
      ...t,
      shipName: args.address.name,
      shipLine1: args.address.line1,
      shipLine2: args.address.line2,
      shipCity: args.address.city,
      shipState: args.address.state,
      shipZip: args.address.zip,
      items: {
        create: args.lines.map((l) => ({
          productId: l.productId,
          titleSnapshot: l.title,
          imageSnapshot: l.image,
          priceCentsSnapshot: l.priceCents,
          quantity: l.quantity,
        })),
      },
    },
  });
}

/**
 * F10: mark an order PAID, decrement stock and (for cart checkouts) remove the bought items
 * from the cart. Idempotent: the PENDING -> PAID flip is a conditional update inside the
 * transaction, so a replayed or concurrent event finds nothing to flip and does nothing.
 * Called by the webhook and, as a fallback, by the success page.
 */
export async function fulfilOrder(stripeSessionId: string, source: CheckoutSource): Promise<"paid" | "already" | "missing"> {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { stripeSessionId },
      select: { id: true, userId: true, status: true, items: { select: { productId: true, quantity: true } } },
    });
    if (!order) return "missing";
    const flipped = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date() },
    });
    if (flipped.count === 0) return "already";
    for (const item of order.items) {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
    }
    if (source === "cart") {
      await tx.cartItem.deleteMany({
        where: { cart: { userId: order.userId }, productId: { in: order.items.map((i) => i.productId) } },
      });
    }
    return "paid";
  });
}

export async function cancelOrder(stripeSessionId: string) {
  await db.order.updateMany({ where: { stripeSessionId, status: "PENDING" }, data: { status: "CANCELLED" } });
}

/** Order numbers shown like the live site's 114-XXXXXXX-XXXXXXX, derived from the serial number. */
export function orderNumber(n: number): string {
  const a = String((n * 7919 + 1000003) % 10_000_000).padStart(7, "0");
  const b = String((n * 104729 + 3) % 10_000_000).padStart(7, "0");
  return `114-${a}-${b}`;
}

export const STATUS_LABEL = {
  PENDING: "Payment not completed",
  PAID: "Paid",
  SHIPPED: "Shipped",
  CANCELLED: "Cancelled",
} as const;
