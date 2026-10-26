"use server";

import { z } from "zod";
import { currentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import type { CartItem } from "@/store/cart";

const MAX_QTY = 10;

async function readCart(userId: string): Promise<CartItem[]> {
  const cart = await db.cart.findUnique({
    where: { userId },
    select: {
      items: {
        orderBy: { id: "asc" },
        select: {
          quantity: true,
          product: { select: { id: true, slug: true, title: true, thumbnail: true, priceCents: true, stock: true } },
        },
      },
    },
  });
  // Prices and stock come from the DB, so the mirror always shows current values.
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

async function requireUser(): Promise<string> {
  const id = await currentUserId();
  if (!id) throw new Error("Not signed in");
  return id;
}

export async function getCart(): Promise<CartItem[]> {
  return readCart(await requireUser());
}

const lines = z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(MAX_QTY) })).max(100);

/** F8: fold the guest cart into the DB cart. quantity = min(existing + guest, stock, 10). */
export async function mergeGuestCart(input: { productId: number; quantity: number }[]): Promise<CartItem[]> {
  const userId = await requireUser();
  const guest = lines.parse(input);
  if (guest.length) {
    const products = await db.product.findMany({
      where: { id: { in: guest.map((g) => g.productId) } },
      select: { id: true, stock: true },
    });
    const stock = new Map(products.map((p) => [p.id, p.stock]));
    await db.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({ where: { userId }, create: { userId }, update: {}, select: { id: true } });
      const existing = new Map(
        (await tx.cartItem.findMany({ where: { cartId: cart.id }, select: { productId: true, quantity: true } })).map((i) => [
          i.productId,
          i.quantity,
        ]),
      );
      for (const g of guest) {
        const s = stock.get(g.productId);
        if (!s) continue; // unknown or out of stock
        const quantity = Math.min((existing.get(g.productId) ?? 0) + g.quantity, s, MAX_QTY);
        await tx.cartItem.upsert({
          where: { cartId_productId: { cartId: cart.id, productId: g.productId } },
          create: { cartId: cart.id, productId: g.productId, quantity },
          update: { quantity },
        });
      }
    });
  }
  return readCart(userId);
}

/** Sets an absolute quantity (0 removes), capped at stock and 10. Returns the cart for reconciliation. */
export async function setCartItem(productId: number, quantity: number): Promise<CartItem[]> {
  const userId = await requireUser();
  const pid = z.number().int().positive().parse(productId);
  const qty = z.number().int().min(0).max(MAX_QTY).parse(quantity);
  const cart = await db.cart.upsert({ where: { userId }, create: { userId }, update: {}, select: { id: true } });
  if (qty === 0) {
    await db.cartItem.deleteMany({ where: { cartId: cart.id, productId: pid } });
  } else {
    const product = await db.product.findUnique({ where: { id: pid }, select: { stock: true } });
    if (product && product.stock > 0) {
      const capped = Math.min(qty, product.stock);
      await db.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId: pid } },
        create: { cartId: cart.id, productId: pid, quantity: capped },
        update: { quantity: capped },
      });
    }
  }
  return readCart(userId);
}
