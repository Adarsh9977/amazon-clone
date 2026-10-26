import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import categoryConfig from "@/prisma/categories.json";

/** Fields every product card needs. Kept small so lists stay cheap. */
export const cardSelect = {
  id: true,
  slug: true,
  title: true,
  brand: true,
  priceCents: true,
  listPriceCents: true,
  rating: true,
  reviewCount: true,
  soldLastMonth: true,
  badge: true,
  stock: true,
  thumbnail: true,
} satisfies Prisma.ProductSelect;

export type CardProduct = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

export type HomeCard = (typeof categoryConfig.home)[number];
export type HeroSlide = (typeof categoryConfig.hero)[number];
export const homeCards: HomeCard[] = categoryConfig.home;
export const heroSlides: HeroSlide[] = categoryConfig.hero;

/** Departments shown in the header sub-nav and the search category select, in nav order. */
export const getDepartments = cache(async () =>
  db.category.findMany({
    where: { parentId: null },
    orderBy: { position: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      children: { orderBy: { position: "asc" }, select: { id: true, slug: true, name: true } },
    },
  }),
);

/** A category plus its parent and children. Null when the slug doesn't exist. */
export const getCategory = cache(async (slug: string) =>
  db.category.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      parent: { select: { slug: true, name: true } },
      children: { orderBy: { position: "asc" }, select: { id: true, slug: true, name: true } },
    },
  }),
);

/** Category ids a filter on `slug` covers: the category itself plus its children (departments). */
export async function categoryIds(slug: string): Promise<string[] | null> {
  const c = await getCategory(slug);
  if (!c) return null;
  return [c.id, ...c.children.map((x) => x.id)];
}

/** One representative image per leaf category, for the home page 2×2 cards. */
export const getCategoryImages = cache(async (slugs: string[]) => {
  const rows = await db.product.findMany({
    where: { category: { slug: { in: slugs } } },
    orderBy: [{ soldLastMonth: "desc" }],
    select: { thumbnail: true, category: { select: { slug: true } } },
  });
  // Take the top two per category so a card repeating a category gets two different images.
  const bySlug = new Map<string, string[]>();
  for (const r of rows) {
    const list = bySlug.get(r.category.slug) ?? [];
    if (list.length < 2) list.push(r.thumbnail);
    bySlug.set(r.category.slug, list);
  }
  return bySlug;
});

export async function getHomeRows() {
  const [deals, topRated, bestSellers] = await Promise.all([
    db.product.findMany({
      where: { listPriceCents: { not: null } },
      orderBy: { soldLastMonth: "desc" },
      take: 14,
      select: cardSelect,
    }),
    db.product.findMany({
      where: { rating: { gte: 4.5 } },
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
      take: 14,
      select: cardSelect,
    }),
    db.product.findMany({
      where: { badge: "BEST_SELLER", category: { parent: { slug: "electronics" } } },
      orderBy: { soldLastMonth: "desc" },
      take: 14,
      select: cardSelect,
    }),
  ]);
  return { deals, topRated, bestSellers };
}
