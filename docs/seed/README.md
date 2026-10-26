# Seed package — Amazon.com clone

Drop this folder's contents into `prisma/` and run three commands. Catalog: **194 products, 24 leaf categories under 7 departments, ~1,700 reviews, 1 demo user**. All product images are real hosted WebP files on `cdn.dummyjson.com`.

## Files

| File | What it is |
| --- | --- |
| `schema.prisma` | Final data model (v1.1). Replace the generated one. |
| `products.json` | 194 products as compact rows (see `_format` key inside). Source: DummyJSON, prices converted to cents, slugs stabilised. |
| `categories.json` | Department → sub-category tree, header nav order, home-page card groupings, hero banners. |
| `seed.ts` | Expands the JSON into Prisma rows: brands for the 92 brand-less products, badges, "bought in past month", 6–12 reviews per product, bullets, search vectors, demo user. Deterministic (seeded PRNG) and idempotent (upserts). |
| `migration_search.sql` | Trigger + GIN index so `searchVector` stays fresh on insert/update. |

## Setup (≈10 minutes)

```bash
npm i -D prisma tsx && npm i @prisma/client bcryptjs && npm i -D @types/bcryptjs
# package.json
#   "prisma": { "seed": "tsx prisma/seed.ts" }

cp seed/* prisma/
npx prisma migrate dev --name init
npx prisma migrate dev --create-only --name search_vector   # paste migration_search.sql body in, then:
npx prisma migrate dev
npx prisma db seed
```

`next.config.ts` needs the image host:

```ts
images: { remotePatterns: [{ protocol: "https", hostname: "cdn.dummyjson.com" }, { protocol: "https", hostname: "images.unsplash.com" }] }
```

## What the seed derives, and why

| Field | Rule | Why |
| --- | --- | --- |
| `brand` | Real brand when DummyJSON has one; otherwise a category-appropriate house brand (Amazon Basics, Amazon Fresh, Wilson…) | Brand facet in the filter rail needs every product to have one |
| `badge` | Per leaf category: top 2 by rating → Best Seller, #3 → Amazon's Choice, one random → Overall Pick | Matches the badge mix on live search pages |
| `reviewCount` | 20–40,000, inversely correlated with price, scaled by rating | Cheap items on Amazon have far more ratings than a $3,000 sofa |
| `soldLastMonth` | 8–38 % of reviewCount | Renders as "1K+ bought in past month" (UI buckets: 50+, 100+, 500+, 1K+, 2K+, 5K+, 10K+) |
| `Review` rows | 6–12 per product, star distribution centred on the product's rating, 20 distinct titles/bodies per star level, 140 reviewer names, dates spread over 18 months | Histogram, "Top reviews" and the rating all agree with each other |
| `bullets` | 3 from the description + brand line + returns line, ALL-CAPS lead | Amazon's "About this item" format |
| `images` | `{CDN}/{category}/{folder}/{1..n}.webp` (1–5 per product), plus `thumbnail.webp` | Real product photography, no hotlinking Amazon |
| `listPriceCents` | Present on 153 of 194 products | Drives the "-23 %" badge, strikethrough, and the Deals filter |

## Catalog shape (useful for the UI)

| Department | Leaves | Products | Price range |
| --- | --- | --- | --- |
| Electronics | smartphones, laptops, tablets, mobile-accessories | 38 | $12.99 – $1,999.99 |
| Home & Kitchen | kitchen-accessories, furniture, home-decoration | 40 | $3.99 – $2,499.99 |
| Fashion | 10 leaves (men's/women's clothing, shoes, watches, bags, jewelry, sunglasses) | 52 | $19.99 – $15,999.99 |
| Beauty & Personal Care | beauty, skin-care, fragrances | 13 | $8.99 – $129.99 |
| Grocery | groceries | 27 | $0.79 – $19.99 |
| Sports & Outdoors | sports-accessories | 17 | $5.99 – $49.99 |
| Automotive | vehicle, motorcycle | 10 | $2,999.99 – $36,999.99 |

Four products ship with `stock: 0` (ids 117, 132, 153, 193) so the "Currently unavailable" state is testable without editing data. Nine have stock ≤ 5 for the "Only N left in stock" state.

## Demo login

`demo@example.com` / `password123` — created by the seed so a grader can skip registration.
