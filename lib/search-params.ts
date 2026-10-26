import { z } from "zod";

// URL params are the single source of truth for search (spec F3, live-site findings #1, #2, #8).

export const PAGE_SIZE = 16;
export const MAX_PAGES = 20;

export const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Avg. Customer Review" },
  { value: "newest", label: "Newest Arrivals" },
  { value: "best", label: "Best Sellers" },
] as const;
export type Sort = (typeof SORTS)[number]["value"];

const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);
const num = z.preprocess(
  (v) => (first(v) === "" || first(v) == null ? undefined : Number(first(v))),
  z.number().finite().nonnegative().optional().catch(undefined),
);

const paramsSchema = z.object({
  k: z.preprocess(first, z.string().trim().max(100).optional().catch(undefined)),
  cat: z.preprocess(first, z.string().max(60).optional().catch(undefined)),
  brand: z.preprocess(
    (v) => (Array.isArray(v) ? v.join(",") : v),
    z
      .string()
      .optional()
      .transform((s) => (s ? s.split(",").map((b) => b.trim()).filter(Boolean).slice(0, 20) : []))
      .catch([]),
  ),
  min: num,
  max: num,
  rating: z.preprocess((v) => Number(first(v)), z.number().int().min(1).max(4).optional().catch(undefined)),
  deals: z.preprocess((v) => first(v) === "1", z.boolean().catch(false)),
  sort: z.preprocess(first, z.enum(SORTS.map((s) => s.value) as [Sort, ...Sort[]]).catch("featured")),
  page: z.preprocess((v) => Number(first(v) ?? 1), z.number().int().min(1).max(MAX_PAGES).catch(1)),
});

export type SearchParams = z.infer<typeof paramsSchema>;
export type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseSearchParams(raw: RawSearchParams): SearchParams {
  const p = paramsSchema.parse(raw);
  if (p.k === "") p.k = undefined;
  return p;
}

/** Builds a /s URL from the current params with some overridden. `undefined`/empty removes a key. */
export function searchHref(
  current: Partial<SearchParams>,
  patch: Partial<Record<keyof SearchParams, string | number | boolean | string[] | undefined>>,
  base = "/s",
): string {
  const merged: Record<string, unknown> = { ...current, page: undefined, ...patch };
  const qs = new URLSearchParams();
  for (const key of ["k", "cat", "brand", "min", "max", "rating", "deals", "sort", "page"] as const) {
    const v = merged[key];
    if (v == null || v === false || v === "") continue;
    if (key === "sort" && v === "featured") continue;
    if (key === "page" && v === 1) continue;
    if (Array.isArray(v)) {
      if (v.length) qs.set(key, v.join(","));
    } else qs.set(key, v === true ? "1" : String(v));
  }
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}
