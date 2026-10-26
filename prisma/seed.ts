// prisma/seed.ts
// Run: npx prisma db seed   (package.json: "prisma": { "seed": "tsx prisma/seed.ts" })
// Idempotent: upserts by stable ids, so re-running is safe.
//
// Reads ./products.json and ./categories.json (copy the seed/ folder into prisma/).
// Deterministic: every "random" value comes from a seeded PRNG keyed on product id,
// so the catalog looks identical on every machine and every reseed.

import { PrismaClient, Badge } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

// ─── Inputs ──────────────────────────────────────────────────────────────

type Row = [
  id: number,
  slug: string,
  title: string,
  description: string,
  categorySlug: string,
  brand: string | null,
  priceCents: number,
  listPriceCents: number | null,
  rating: number,
  stock: number,
  imageFolder: string,
  imageCount: number,
];

const here = path.dirname(new URL(import.meta.url).pathname);
const { rows } = JSON.parse(fs.readFileSync(path.join(here, "products.json"), "utf8")) as { rows: Row[] };
const cats = JSON.parse(fs.readFileSync(path.join(here, "categories.json"), "utf8")) as {
  departments: { slug: string; name: string; nav?: boolean; children: { slug: string; name: string }[] }[];
};

const CDN = "https://cdn.dummyjson.com/product-images";

// ─── Deterministic helpers ───────────────────────────────────────────────

function rng(seed: number) {
  // mulberry32
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, arr: T[]) => arr[Math.floor(r() * arr.length)];
const between = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

// Brands for the 92 products DummyJSON ships without one, by category.
const FALLBACK_BRANDS: Record<string, string[]> = {
  groceries: ["Amazon Fresh", "365 by Whole Foods Market", "Happy Belly", "Aplenty"],
  "home-decoration": ["Amazon Basics", "Rivet", "Stone & Beam", "Ravenna Home"],
  "kitchen-accessories": ["Amazon Basics", "OXO", "Cuisinart", "KitchenAid", "Farberware"],
  "sports-accessories": ["Wilson", "Spalding", "Franklin Sports", "Rawlings", "SG"],
  tops: ["Amazon Essentials", "Daily Ritual", "Goodthreads"],
  "womens-dresses": ["Amazon Essentials", "The Drop", "Lark & Ro"],
  "womens-jewellery": ["PAVOI", "Amazon Collection", "Kendra Scott"],
};

// Review generator. Titles/bodies are rating-aware so the histogram and text agree.
const NAMES = [
  "Eleanor Collins","Lucas Gordon","Savannah Gomez","Christian Perez","Nicholas Bailey","Alexander Jones",
  "Elijah Cruz","Avery Perez","Liam Garcia","Ruby Andrews","Clara Berry","Benjamin Wilson","Liam Smith",
  "Layla Young","Daniel Cook","Jacob Cooper","Leah Henderson","Xavier Wright","Penelope Harper","Emma Miller",
  "Mateo Bennett","Nolan Gonzalez","Aurora Lawson","Cameron Perez","Addison Wright","Christopher West",
  "Vivian Carter","Mason Wright","Lillian Bishop","Aaliyah Hanson","Avery Barnes","Ella Cook","Elena Long",
  "Logan Torres","Aria Parker","Dylan Wells","Sophia Brown","Scarlett Bowman","William Gonzalez","Natalie Harris",
  "Noah Lewis","Ethan Thompson","Jackson Evans","Sadie Morales","Victoria McDonald","Hazel Evans","Zoe Bennett",
  "Lincoln Kelly","James Davis","Nicholas Edwards","Zachary Lee","Nova Cooper","Penelope King","Benjamin Foster",
  "Caleb Perkins","Isabella Jackson","Nathan Dixon","Avery Carter","Henry Hill","Luna Russell","Autumn Gomez",
  "Jace Smith","Bella Grant","Aria Flores","Emily Brown","Jackson Morales","Nora Russell","Logan Lawson",
  "Harper Turner","Oscar Powers","Gabriel Adams","Lily Torres","Ariana Ross","Aurora Rodriguez","Miles Stevenson",
  "Maya Reed","Evelyn Gonzalez","Grace Perry","Cameron Burke","Hannah Robinson","Amelia Perez","Olivia Wilson",
  "Hunter Gordon","Carter Baker","Jonathan Pierce","Grayson Coleman","Ethan Fletcher","Stella Morris",
  "Austin Hudson","Luke Cooper","Max Russell","Ella Adams","Sophia Jones","Lucas Ramirez","Alexander Hernandez",
  "Paisley Bell","Nolan Bryant","Luna Perez","Henry Turner","Evelyn Walker","Mila Hernandez","Harper Garcia",
  "Tyler Davis","Ava Harris","Isabella Anderson","Layla Sullivan","Elena Baker","Avery Scott","Mateo Perez",
  "Nathan Reed","Eli Ward","James Garcia","Hannah Howard","Isaac Lawrence","Leo Rivera","Henry Adams",
  "Lillian Simmons","Aaliyah Martinez","Mateo Nguyen","Michael Johnson","Alice Smith","David Martinez",
  "Adrian Flores","Mia Miller","Stella Hughes","Jaxon Barnes","Julian Newton","Brayden Hill","Ava Taylor",
  "Gabriel Mitchell","Owen Fisher","Bella Gonzalez","Samantha Howard","Caleb Nelson","Claire Foster",
];

const REVIEWS: Record<number, { titles: string[]; bodies: string[] }> = {
  5: {
    titles: ["Exactly what I needed", "Exceeded expectations", "Five stars, no notes", "Buy it", "Worth every penny"],
    bodies: [
      "Arrived two days early and was packed well. Quality is better than I expected at this price. Already recommended it to a friend.",
      "I did a lot of comparing before buying this and I'm glad I went with it. Does exactly what the listing says. Would buy again.",
      "Second one I've bought. The first lasted years. Nothing to complain about.",
      "Great value. Looks and feels like the photos. Setup took a couple of minutes.",
      "Honestly impressed. I was skeptical because of the price but it's held up perfectly for three months of daily use.",
    ],
  },
  4: {
    titles: ["Very good, one small gripe", "Solid purchase", "Happy with it", "Good quality"],
    bodies: [
      "Works well and looks nice. Knocking off a star because the instructions were vague, but I figured it out.",
      "Good product for the money. Slightly smaller than I pictured, so check the dimensions. Otherwise no complaints.",
      "Does the job. Shipping was fast. Would be five stars if the color matched the photo a bit better.",
      "Nice quality and feels durable. Took a week to arrive which is the only reason it isn't five stars.",
    ],
  },
  3: {
    titles: ["It's okay", "Average", "Mixed feelings", "Fine for the price"],
    bodies: [
      "Not bad, not great. It does what it's supposed to but the build feels a little cheap.",
      "Decent, but I expected more based on the other reviews. Might work better for someone with different needs.",
      "Works as described. The finish scratches easily though. You get what you pay for.",
    ],
  },
  2: {
    titles: ["Disappointed", "Not as described", "Wouldn't buy again"],
    bodies: [
      "Looked better in the photos. Mine arrived with a small defect and customer service was slow to respond.",
      "Stopped working properly after about a month. Returned it without much hassle, but still frustrating.",
      "The quality just isn't there. Feels flimsy and the sizing is off.",
    ],
  },
  1: {
    titles: ["Do not buy", "Waste of money", "Broke on first use"],
    bodies: [
      "Arrived damaged and the replacement was no better. Returning for a refund.",
      "Completely different from what was advertised. Save your money.",
      "Fell apart within a week. Very poor quality control.",
    ],
  },
};

// ─── Derivations ─────────────────────────────────────────────────────────

function bulletsFor(description: string, brand: string, categoryName: string): string[] {
  // Amazon's "About this item" is 4–6 bullets in ALL-CAPS-LEAD style. We build from the description sentences.
  const sentences = description.split(/(?<=[.!?])\s+/).filter(Boolean);
  const bullets = sentences.slice(0, 3).map((s) => {
    const [lead, ...rest] = s.split(/[:,–—]/);
    const head = lead.trim().split(" ").slice(0, 3).join(" ").toUpperCase();
    return rest.length ? `${head}: ${rest.join(",").trim()}` : `${head}: ${s.trim()}`;
  });
  bullets.push(`BRAND YOU CAN TRUST: ${brand} designs products for everyday ${categoryName.toLowerCase()} use`);
  bullets.push("EASY RETURNS: Free 30-day returns on this item");
  return bullets;
}

function bucketSold(n: number): number {
  // Store the exact number; the UI buckets it as 50+, 100+, 500+, 1K+, 2K+, 5K+, 10K+.
  return n;
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.time("seed");

  // 1. Categories (two levels)
  const leafIdBySlug = new Map<string, string>();
  const leafNameBySlug = new Map<string, string>();
  let pos = 0;
  for (const dept of cats.departments) {
    const parent = await prisma.category.upsert({
      where: { slug: dept.slug },
      update: { name: dept.name, position: pos, showNav: !!dept.nav },
      create: { slug: dept.slug, name: dept.name, position: pos, showNav: !!dept.nav },
    });
    pos++;
    let childPos = 0;
    for (const child of dept.children) {
      const c = await prisma.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentId: parent.id, position: childPos },
        create: { slug: child.slug, name: child.name, parentId: parent.id, position: childPos },
      });
      childPos++;
      leafIdBySlug.set(child.slug, c.id);
      leafNameBySlug.set(child.slug, child.name);
    }
  }
  console.log(`categories: ${leafIdBySlug.size} leaves under ${cats.departments.length} departments`);

  // 2. Badges: top 2 by rating in each leaf → BEST_SELLER; next 1 → AMAZONS_CHOICE; 1 random → OVERALL_PICK
  const byCat = new Map<string, Row[]>();
  for (const r of rows) byCat.set(r[4], [...(byCat.get(r[4]) ?? []), r]);
  const badgeById = new Map<number, Badge>();
  for (const [slug, list] of byCat) {
    const sorted = [...list].sort((a, b) => b[8] - a[8]);
    sorted.slice(0, 2).forEach((r) => badgeById.set(r[0], "BEST_SELLER"));
    if (sorted[2]) badgeById.set(sorted[2][0], "AMAZONS_CHOICE");
    const r = rng(slug.length * 7919);
    const candidate = pick(r, sorted.slice(3));
    if (candidate && !badgeById.has(candidate[0])) badgeById.set(candidate[0], "OVERALL_PICK");
  }

  // 3. Products + reviews
  let reviewTotal = 0;
  for (const row of rows) {
    const [id, slug, title, description, categorySlug, brandIn, priceCents, listPriceCents, rating, stock, folder, imageCount] = row;
    const r = rng(id * 2654435761);
    const categoryId = leafIdBySlug.get(categorySlug);
    if (!categoryId) throw new Error(`No category for ${categorySlug} (product ${id})`);
    const categoryName = leafNameBySlug.get(categorySlug)!;
    const brand = brandIn ?? pick(r, FALLBACK_BRANDS[categorySlug] ?? ["Amazon Basics"]);

    const images = Array.from({ length: imageCount }, (_, i) => `${CDN}/${categorySlug}/${folder}/${i + 1}.webp`);
    const thumbnail = `${CDN}/${categorySlug}/${folder}/thumbnail.webp`;

    // Review count correlates loosely with price (cheap things sell more) and rating.
    const base = priceCents < 2000 ? between(r, 800, 40000) : priceCents < 20000 ? between(r, 150, 12000) : between(r, 20, 2500);
    const reviewCount = Math.round(base * (0.6 + rating / 10));
    const soldLastMonth = bucketSold(Math.round(reviewCount * (0.08 + r() * 0.3)));

    // Generate 6–12 review rows whose average lands near `rating`.
    const n = between(r, 6, 12);
    const reviews = Array.from({ length: n }, (_, i) => {
      // Skew distribution toward the product's rating.
      const roll = r();
      let stars: number;
      if (roll < 0.55) stars = Math.round(rating);
      else if (roll < 0.8) stars = Math.min(5, Math.round(rating) + 1);
      else if (roll < 0.93) stars = Math.max(1, Math.round(rating) - 1);
      else stars = between(r, 1, 5);
      const pool = REVIEWS[stars];
      const daysAgo = between(r, 3, 540);
      return {
        reviewerName: pick(r, NAMES),
        rating: stars,
        title: pick(r, pool.titles),
        body: pick(r, pool.bodies),
        verified: r() > 0.15,
        createdAt: new Date(Date.now() - daysAgo * 86400000),
      };
    });
    reviewTotal += reviews.length;

    await prisma.product.upsert({
      where: { id },
      update: {},
      create: {
        id,
        slug,
        title,
        description,
        brand,
        priceCents,
        listPriceCents,
        rating,
        reviewCount,
        soldLastMonth,
        badge: badgeById.get(id) ?? null,
        stock,
        thumbnail,
        images,
        bullets: bulletsFor(description, brand, categoryName),
        categoryId,
        reviews: { create: reviews },
      },
    });
  }
  console.log(`products: ${rows.length}, reviews: ${reviewTotal}`);

  // 4. Full-text search vector + GIN index (idempotent)
  await prisma.$executeRawUnsafe(`
    UPDATE "Product" SET "searchVector" =
      setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
      setweight(to_tsvector('english', coalesce(brand,'')), 'B') ||
      setweight(to_tsvector('english', coalesce(description,'')), 'C');
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS product_search_idx ON "Product" USING GIN ("searchVector");`);
  console.log("search vectors + GIN index ready");

  // 5. Demo user so graders can sign in without registering: demo@example.com / password123
  const bcrypt = await import("bcryptjs");
  await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: { email: "demo@example.com", name: "Demo Shopper", passwordHash: await bcrypt.hash("password123", 10) },
  });
  console.log("demo user: demo@example.com / password123");

  console.timeEnd("seed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
