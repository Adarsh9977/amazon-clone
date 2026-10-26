import { Prisma } from "@prisma/client";
import { db } from "./db";
import { cardSelect, categoryIds, type CardProduct } from "./catalog";
import { MAX_PAGES, PAGE_SIZE, type SearchParams } from "./search-params";

export * from "./search-params";

type FacetKey = "cat" | "brand";

const likePattern = (q: string) => `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
const categoryMatch = (like: string) =>
  Prisma.sql`p."categoryId" IN (SELECT id FROM "Category" WHERE name ILIKE ${like} OR slug ILIKE ${like})`;

async function whereSql(p: SearchParams, omit?: FacetKey): Promise<Prisma.Sql | null> {
  const conds: Prisma.Sql[] = [];
  if (p.k) {
    const like = likePattern(p.k);
    // Full-text match, a substring fallback so partial words ("headph") still match, and the
    // category name so "phones" finds the Cell Phones category, not just titles containing it.
    conds.push(
      Prisma.sql`(p."searchVector" @@ websearch_to_tsquery('english', ${p.k}) OR p.title ILIKE ${like} OR p.brand ILIKE ${like} OR ${categoryMatch(like)})`,
    );
  }
  if (p.cat && omit !== "cat") {
    const ids = await categoryIds(p.cat);
    if (!ids) return null; // unknown category: no results
    conds.push(Prisma.sql`p."categoryId" = ANY(${ids})`);
  }
  if (p.brand.length && omit !== "brand") conds.push(Prisma.sql`p.brand = ANY(${p.brand})`);
  if (p.min != null) conds.push(Prisma.sql`p."priceCents" >= ${Math.round(p.min * 100)}`);
  if (p.max != null) conds.push(Prisma.sql`p."priceCents" <= ${Math.round(p.max * 100)}`);
  if (p.rating) conds.push(Prisma.sql`p.rating >= ${p.rating}`);
  if (p.deals) conds.push(Prisma.sql`p."listPriceCents" > p."priceCents"`);
  return conds.length ? Prisma.sql`WHERE ${Prisma.join(conds, " AND ")}` : Prisma.empty;
}

function orderSql(p: SearchParams): Prisma.Sql {
  switch (p.sort) {
    case "price-asc":
      return Prisma.sql`p."priceCents" ASC, p.id`;
    case "price-desc":
      return Prisma.sql`p."priceCents" DESC, p.id`;
    case "rating":
      return Prisma.sql`p.rating DESC, p."reviewCount" DESC, p.id`;
    case "newest":
      return Prisma.sql`p."createdAt" DESC, p.id DESC`;
    case "best":
      return Prisma.sql`p."soldLastMonth" DESC, p.id`;
    default:
      return p.k
        ? Prisma.sql`${categoryMatch(likePattern(p.k))} DESC, ts_rank(p."searchVector", websearch_to_tsquery('english', ${p.k})) DESC, (p.title ILIKE ${likePattern(p.k)}) DESC, p."soldLastMonth" DESC, p.id`
        : Prisma.sql`(p.badge IS NOT NULL) DESC, p."soldLastMonth" DESC, p.id`;
  }
}

export type Facets = {
  categories: { slug: string; name: string; parentSlug: string | null; count: number }[];
  brands: { brand: string; count: number }[];
};

export type SearchResult = {
  params: SearchParams;
  products: CardProduct[];
  total: number;
  page: number;
  totalPages: number;
  facets: Facets;
};

export async function search(p: SearchParams): Promise<SearchResult> {
  const where = await whereSql(p);
  const empty = { params: p, products: [], total: 0, page: 1, totalPages: 0 };
  if (where === null) return { ...empty, facets: { categories: [], brands: [] } };

  const offset = (p.page - 1) * PAGE_SIZE;
  const [rows, facets] = await Promise.all([
    db.$queryRaw<{ id: number; total: bigint }[]>`
      SELECT p.id, COUNT(*) OVER() AS total FROM "Product" p ${where}
      ORDER BY ${orderSql(p)} LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
    getFacets(p),
  ]);

  let total = rows.length ? Number(rows[0].total) : 0;
  if (!rows.length && p.page > 1) {
    // Page past the end (e.g. a stale link): count so the header and pagination still make sense.
    const [c] = await db.$queryRaw<{ n: bigint }[]>`SELECT COUNT(*) AS n FROM "Product" p ${where}`;
    total = Number(c.n);
  }
  const byId = new Map(
    (await db.product.findMany({ where: { id: { in: rows.map((r) => r.id) } }, select: cardSelect })).map((x) => [x.id, x]),
  );
  return {
    params: p,
    products: rows.map((r) => byId.get(r.id)!).filter(Boolean),
    total,
    page: p.page,
    totalPages: Math.min(MAX_PAGES, Math.ceil(total / PAGE_SIZE)),
    facets,
  };
}

/** Facet counts. Each facet ignores its own filter so you can widen within it (standard faceting). */
async function getFacets(p: SearchParams): Promise<Facets> {
  const [whereNoCat, whereNoBrand] = await Promise.all([whereSql(p, "cat"), whereSql(p, "brand")]);
  const [cats, brands] = await Promise.all([
    whereNoCat
      ? db.$queryRaw<{ slug: string; name: string; parent_slug: string | null; n: bigint }[]>`
          SELECT c.slug, c.name, pc.slug AS parent_slug, COUNT(*) AS n
          FROM "Product" p JOIN "Category" c ON c.id = p."categoryId" LEFT JOIN "Category" pc ON pc.id = c."parentId"
          ${whereNoCat} GROUP BY c.slug, c.name, pc.slug, c.position ORDER BY c.position, c.name`
      : [],
    whereNoBrand
      ? db.$queryRaw<{ brand: string; n: bigint }[]>`
          SELECT p.brand, COUNT(*) AS n FROM "Product" p ${whereNoBrand}
          GROUP BY p.brand ORDER BY COUNT(*) DESC, p.brand LIMIT 30`
      : [],
  ]);
  return {
    categories: cats.map((c) => ({ slug: c.slug, name: c.name, parentSlug: c.parent_slug, count: Number(c.n) })),
    brands: brands.map((b) => ({ brand: b.brand, count: Number(b.n) })),
  };
}

/** Up to 6 titles for the search-box dropdown (F15). */
export async function suggest(q: string) {
  const like = `${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  return db.$queryRaw<{ title: string; slug: string }[]>`
    SELECT title, slug FROM "Product" p
    WHERE p."searchVector" @@ websearch_to_tsquery('english', ${q}) OR p.title ILIKE ${like} OR p.title ILIKE ${"% " + like}
    ORDER BY (p.title ILIKE ${like}) DESC, p."soldLastMonth" DESC LIMIT 6`;
}
