import { cache } from "react";
import { db } from "./db";
import { cardSelect } from "./catalog";

export const getProduct = cache(async (slug: string) =>
  db.product.findUnique({
    where: { slug },
    select: {
      ...cardSelect,
      description: true,
      images: true,
      bullets: true,
      categoryId: true,
      category: { select: { slug: true, name: true, parent: { select: { slug: true, name: true } } } },
    },
  }),
);

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProduct>>>;

/** Rating histogram (% per star) from seeded reviews, plus the most recent reviews. */
export async function getReviewSummary(productId: number) {
  const [groups, top] = await Promise.all([
    db.review.groupBy({ by: ["rating"], where: { productId }, _count: { _all: true } }),
    db.review.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, reviewerName: true, rating: true, title: true, body: true, verified: true, createdAt: true },
    }),
  ]);
  const total = groups.reduce((n, g) => n + g._count._all, 0);
  const histogram = [5, 4, 3, 2, 1].map((star) => {
    const n = groups.find((g) => g.rating === star)?._count._all ?? 0;
    return { star, pct: total ? Math.round((n / total) * 100) : 0 };
  });
  return { histogram, reviews: top };
}

/** F18: products from the same category, best sellers first. */
export async function getRelated(productId: number, categoryId: string) {
  return db.product.findMany({
    where: { categoryId, id: { not: productId } },
    orderBy: { soldLastMonth: "desc" },
    take: 8,
    select: cardSelect,
  });
}
