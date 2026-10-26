# Amazon.com Clone — Product & Technical Specification

**Version:** 1.0 · **Date:** 2026-10-23 · **Window:** 12 hours · **Target:** Live on Vercel, public repo

---

## 1. Overview

### 1.1 Purpose
Rebuild the core Amazon.com shopping experience from live reference: browse a catalog, search with filters, view a product, manage a cart as a guest or signed-in user, pay through Stripe (test mode), and see order history. The deliverable is a deployed, working storefront plus a README that explains the architecture and the cuts made.

### 1.2 Definition of done
A stranger with the URL can, in a fresh incognito window: search for a product, filter and sort results, open a product page, add it to the cart while logged out, register, keep the cart, check out with Stripe test card `4242 4242 4242 4242`, land on a confirmation page, and find the order under `/orders`. Every page is usable at 390 px wide.

### 1.3 Non-goals
Real payments, Prime, deals timers, seller tools, returns, multiple marketplaces, ML recommendations, image uploads, social login, email sending. These are listed in the README as deliberate cuts.

### 1.4 Users
| Persona | What they do |
| --- | --- |
| Guest | Browse, search, view products, build a cart (localStorage) |
| Customer | Everything a guest does, plus persistent cart, checkout, order history |
| Grader | Clicks through the purchase path, inspects repo and README |

---

## 2. Tech stack

| Layer | Choice | Version / notes |
| --- | --- | --- |
| Framework | Next.js, App Router, TypeScript | 15.x, `src/`-less layout under `app/` |
| Styling | Tailwind CSS | v4; custom tokens for Amazon palette |
| Database | PostgreSQL on Neon | Free tier, pooled + direct URLs |
| ORM | Prisma | `prisma migrate`, `prisma db seed` |
| Auth | Auth.js v5 | Credentials provider, bcrypt (cost 10), JWT session strategy |
| Payments | Stripe Checkout + webhooks | Test mode only |
| Search | Postgres full-text (`tsvector`, GIN index) | Plus Prisma filters for category/price/rating |
| Client state | Zustand | Guest cart persisted to `localStorage` |
| Validation | Zod | Shared between forms and route handlers |
| Images | `next/image` | Remote pattern for `cdn.dummyjson.com` |
| Seed data | DummyJSON products | 194 products, ~20 categories |
| Hosting | Vercel | Production = `main`, previews per PR |

---

## 3. Design system

### 3.1 Color tokens (Tailwind `theme.extend.colors`)
| Token | Hex | Use |
| --- | --- | --- |
| `amz-navy` | `#131921` | Header background |
| `amz-navy-2` | `#232f3e` | Sub-navigation bar, footer top |
| `amz-orange` | `#ff9900` | Logo smile, Buy Now button |
| `amz-yellow` | `#febd69` | Search button, Add to Cart |
| `amz-yellow-hover` | `#f3a847` | Button hover |
| `amz-link` | `#007185` | Links, product titles on hover |
| `amz-price` | `#b12704` | Price text |
| `amz-star` | `#de7921` | Rating stars |
| `amz-success` | `#007600` | "In stock" |
| `amz-bg` | `#eaeded` | Page background behind cards |
| `amz-border` | `#d5d9d9` | Card and input borders |

### 3.2 Typography
Font stack: `"Amazon Ember", Arial, sans-serif`. Sizes: body 14 px, product title 16–18 px, price 28 px on product page, headings 21 px. Line height 20 px for body.

### 3.3 Components (`components/`)
| Component | Props | Behaviour |
| --- | --- | --- |
| `Header` | `cartCount`, `session` | Sticky; logo, Deliver-to stub, `SearchBar`, account menu, Orders link, cart badge |
| `SearchBar` | `defaultQuery`, `defaultCategory` | Category select + text input + yellow button; submits to `/s?k=` |
| `ProductCard` | `product` | Image, title (2-line clamp), stars + count, price, "Add to Cart" |
| `Price` | `cents`, `listCents?`, `size` | Formats cents; strikethrough list price; "-23%" badge when discounted |
| `Stars` | `rating`, `count?` | 5 star glyphs with half-star support |
| `FilterRail` | `facets`, `current` | Category list, price ranges, "4 stars & up"; updates URL params |
| `SortSelect` | `current` | Relevance / Price low→high / Price high→low / Avg rating |
| `Pagination` | `page`, `totalPages` | Prev / numbered / Next; preserves other params |
| `Gallery` | `images[]` | Vertical thumbnail strip, main image swap on hover/click |
| `BuyBox` | `product` | Price, delivery line, stock status, quantity select, Add to Cart, Buy Now |
| `CartLine` | `item` | Thumbnail, title, stock, quantity dropdown (1–10), Delete, line total |
| `Skeleton*` | — | Shimmer placeholders for cards, product page, orders |
| `EmptyState` | `title`, `body`, `cta` | Used for empty cart, no results, no orders |

---

## 4. Data model

### 4.1 Prisma schema (abridged)

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  createdAt    DateTime @default(now())
  cart         Cart?
  orders       Order[]
  reviews      Review[]
}

model Category {
  id       String     @id @default(cuid())
  slug     String     @unique
  name     String
  parentId String?
  parent   Category?  @relation("Sub", fields: [parentId], references: [id])
  children Category[] @relation("Sub")
  products Product[]
}

model Product {
  id             String   @id @default(cuid())
  slug           String   @unique
  title          String
  description    String
  brand          String
  priceCents     Int
  listPriceCents Int?
  rating         Float    @default(0)
  reviewCount    Int      @default(0)
  stock          Int
  images         String[]
  bullets        String[]
  categoryId     String
  category       Category @relation(fields: [categoryId], references: [id])
  searchVector   Unsupported("tsvector")?
  cartItems      CartItem[]
  orderItems     OrderItem[]
  reviews        Review[]
  createdAt      DateTime @default(now())
  @@index([categoryId])
  @@index([priceCents])
  @@index([rating])
}

model Cart {
  id        String     @id @default(cuid())
  userId    String     @unique
  user      User       @relation(fields: [userId], references: [id])
  items     CartItem[]
  updatedAt DateTime   @updatedAt
}

model CartItem {
  id        String  @id @default(cuid())
  cartId    String
  cart      Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId String
  product   Product @relation(fields: [productId], references: [id])
  quantity  Int
  @@unique([cartId, productId])
}

enum OrderStatus { PENDING PAID SHIPPED }

model Order {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  stripeSessionId String      @unique
  status          OrderStatus @default(PENDING)
  subtotalCents   Int
  taxCents        Int
  shippingCents   Int
  totalCents      Int
  shipName        String
  shipLine1       String
  shipLine2       String?
  shipCity        String
  shipState       String
  shipZip         String
  items           OrderItem[]
  createdAt       DateTime    @default(now())
  @@index([userId, createdAt])
}

model OrderItem {
  id                String  @id @default(cuid())
  orderId           String
  order             Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId         String
  product           Product @relation(fields: [productId], references: [id])
  titleSnapshot     String
  imageSnapshot     String
  priceCentsSnapshot Int
  quantity          Int
}

model Review {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  rating    Int
  title     String
  body      String
  createdAt DateTime @default(now())
  @@unique([productId, userId])
}
```

### 4.2 Full-text search migration (raw SQL)
```sql
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;
UPDATE "Product" SET "searchVector" =
  setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
  setweight(to_tsvector('english', coalesce(brand,'')), 'B') ||
  setweight(to_tsvector('english', coalesce(description,'')), 'C');
CREATE INDEX IF NOT EXISTS product_search_idx ON "Product" USING GIN ("searchVector");
```

### 4.3 Seed (`prisma/seed.ts`)
1. `GET https://dummyjson.com/products?limit=0` → 194 products.
2. Upsert a `Category` per distinct `category` string (slugified).
3. Map each product: `priceCents = Math.round(price * 100)`, `listPriceCents = Math.round(price / (1 - discountPercentage/100) * 100)`, `slug = slugify(title) + '-' + id`, `images = images.slice(0,5)`, `bullets = [description split into ≤4 sentences]`, `rating`, `stock`, `reviewCount = reviews.length`.
4. Run the search-vector `UPDATE`.

### 4.4 Money rules
- All amounts are integer cents.
- Tax: 8 % of subtotal, rounded.
- Shipping: `$0` if subtotal ≥ `$35.00`, else `$5.99`.
- Totals are computed on the server from DB prices at checkout time; the client never sends prices.

---

## 5. Routes & pages

| Route | Type | Auth | Data | Description |
| --- | --- | --- | --- | --- |
| `/` | RSC | — | Categories, 3 product rows | Home |
| `/s` | RSC | — | Search query | Search results; params `k, cat, min, max, rating, sort, page` |
| `/c/[slug]` | RSC | — | Products in category | Category browse (reuses results UI) |
| `/dp/[slug]` | RSC | — | Product + 6 related | Product detail; 404 on unknown slug |
| `/cart` | Client | — | Zustand or DB cart | Cart page |
| `/signin` | Client form | — | — | Email + password |
| `/register` | Client form | — | — | Name, email, password |
| `/checkout` | RSC + client form | Required | DB cart | Address + summary → Stripe |
| `/checkout/success` | RSC | Required | Order by `session_id` | Thank-you; polls until order exists |
| `/orders` | RSC | Required | User's orders | Order history |
| `/orders/[id]` | RSC | Required | Order + items | Order detail; 404 if not owner |
| `/wishlist` | RSC | Required | Wishlist | P2 |

### 5.1 API routes
| Method & path | Auth | Body / params | Response |
| --- | --- | --- | --- |
| `POST /api/checkout` | Required | `{ address: Address }` | `{ url }` Stripe Checkout URL |
| `POST /api/webhooks/stripe` | Stripe signature | Raw event | `200` always after verification |
| `GET /api/suggest?q=` | — | query | `{ items: {title, slug}[] }` (max 6) |
| `POST /api/auth/[...nextauth]` | — | Auth.js | Managed |

### 5.2 Server actions (`actions/`)
| Action | Input | Effect |
| --- | --- | --- |
| `register(form)` | name, email, password | Creates user, signs in, returns redirect |
| `mergeGuestCart(items)` | `{productId, quantity}[]` | Upserts into DB cart, quantities summed and capped at stock |
| `setCartItem(productId, qty)` | qty 0 removes | Updates DB cart (signed-in only) |
| `postReview(productId, rating, title, body)` | — | P2; recomputes product rating |

---

## 6. Feature specifications

Priority: **P0** must ship · **P1** ship if P0 done by hour 9 · **P2** stretch.

### F1 · Global header — P0
- Sticky dark navy bar, 60 px tall, with: text wordmark "amazon" + orange smile underline, "Deliver to [City]" stub, `SearchBar` taking remaining width, "Hello, sign in / Account & Lists" menu, "Returns & Orders" link, cart icon with live count badge.
- Sub-nav bar below (navy-2) with "All", 6 category links.
- Under 768 px: logo, search bar full width on second row, hamburger replaces links.
- Cart count: Zustand count when guest; DB count hydrated from server when signed in.
- **Acceptance:** present on every page; count updates instantly after Add to Cart; search from any page lands on `/s?k=`.

### F2 · Home page — P0
- Hero carousel: 3 static banner images, auto-advance every 5 s, arrows, dots.
- Row of 4 category cards (image, title, "Shop now" link) overlapping the hero bottom.
- Three horizontal scroll rows: "Deals" (products with `listPriceCents`), "Top rated" (rating ≥ 4.5), one category row.
- **Acceptance:** server-rendered; LCP < 2.5 s; all links resolve.

### F3 · Search results — P0
- URL params are the single source of truth: `k` (query), `cat`, `min`, `max` (dollars), `rating` (min), `sort` (`relevance|price-asc|price-desc|rating`), `page` (default 1, 20 per page).
- Query: when `k` present, `searchVector @@ plainto_tsquery('english', k)` ranked by `ts_rank`; otherwise category/filter only.
- Left rail facets: Department (categories with counts), Price (Under $25, $25–50, $50–100, $100–200, $200+, custom min/max), Avg. Customer Review (4+, 3+, 2+, 1+).
- Header line: "1–20 of 87 results for **"headphones"**", sort select on the right.
- Result cards: image 200 px, title linking to `/dp/`, stars, price with list strikethrough, "Add to Cart".
- Empty state: "No results for X. Try checking your spelling or use more general terms."
- **Acceptance:** every filter change updates the URL without full reload; copy-pasting the URL reproduces the view; pagination preserves filters.

### F4 · Category browse — P0
- `/c/[slug]` renders the same results component with `cat` fixed and breadcrumb "Home › Category".
- **Acceptance:** 404 on unknown slug; filter rail still works.

### F5 · Product detail page — P0
- Three columns at ≥ 1024 px: gallery (thumbnails left + main image), center info, right buy box. Stacks to one column on mobile.
- Center: title, brand link, stars + "(1,234 ratings)", divider, price with "List: $X" strikethrough and "-23%" red badge, "About this item" bullets, description.
- Buy box: price, "FREE delivery" line (date = today + 3 days), "In Stock" green or "Only N left in stock" red when stock ≤ 5, "Out of stock" disables buttons; quantity select 1–10 capped at stock; yellow "Add to Cart"; orange "Buy Now"; "Ships from / Sold by" stub.
- Gallery: hover or click thumbnail swaps main image; main image zooms on hover (CSS scale).
- Related row (P2 F18) below.
- **Acceptance:** `generateMetadata` sets title and OG image; unknown slug → `not-found.tsx`; Add to Cart shows toast "Added to cart" and updates header badge.

### F6 · Cart (guest) — P0
- Zustand store `{ items: {productId, slug, title, image, priceCents, stock, quantity}[] }` persisted under key `amz-cart-v1`.
- `/cart`: left column of `CartLine`s with "Subtotal (N items): $X" at bottom; right sticky box with subtotal and "Proceed to checkout". Free-shipping nudge: "Add $X of eligible items to your order to qualify for FREE Shipping."
- Quantity dropdown 1–10; "Delete" link; "Save for later" stub (P2).
- Empty state: "Your Amazon Cart is empty" with "Shop today's deals" link.
- Guest clicking checkout → `/signin?callbackUrl=/checkout`.
- **Acceptance:** cart survives reload; totals correct to the cent; optimistic updates with no flicker.

### F7 · Authentication — P0
- `/register`: name, email, password (≥ 8 chars), re-enter password; Zod validation; inline errors; creates user with bcrypt hash; auto sign-in.
- `/signin`: Amazon-style two-step (email, then password) in a centered card with logo above; "Keep me signed in" checkbox; error "Your password is incorrect".
- Auth.js JWT session, 30-day expiry; `middleware.ts` protects `/checkout`, `/orders`, `/wishlist`.
- **Acceptance:** wrong password shows inline error without reload; signed-in header shows "Hello, Name"; sign-out from account menu.

### F8 · Cart merge on login — P0
- After successful sign-in or registration, client calls `mergeGuestCart(items)` with the Zustand items, then clears localStorage and hydrates from DB.
- Merge rule: for each guest item, `quantity = min(existing + guest, stock, 10)`.
- Signed-in cart mutations go through `setCartItem` server action; Zustand holds a mirror for instant UI.
- **Acceptance:** add 2 as guest → sign in → cart shows 2; sign out, sign in on another browser → still 2.

### F9 · Checkout — P0
- Requires auth. Page shows: 1) Shipping address form (name, line1, line2, city, state select, ZIP) with Zod, 2) Payment note "You'll enter card details securely on the next page", 3) Review items list; right sticky summary: items, shipping, tax, order total, "Place your order" button.
- `POST /api/checkout`: loads DB cart, rejects if empty or any item exceeds stock, computes totals, creates `Order` with `status=PENDING` and address, creates Stripe Checkout Session with `line_items` from DB prices, `metadata.orderId`, `success_url=/checkout/success?session_id={CHECKOUT_SESSION_ID}`, `cancel_url=/cart`; stores `stripeSessionId` on the order; returns URL.
- **Acceptance:** card `4242…` succeeds; `4000 0000 0000 0002` is declined by Stripe and returns to cart with order still PENDING; address validation blocks empty fields.

### F10 · Order fulfilment via webhook — P0
- `POST /api/webhooks/stripe`: verify signature with `STRIPE_WEBHOOK_SECRET`; on `checkout.session.completed` find order by `stripeSessionId`; if already PAID return 200 (idempotent); in a transaction: set `status=PAID`, snapshot items from cart into `OrderItem`, decrement `Product.stock`, delete cart items.
- Also handle `checkout.session.expired` → leave PENDING (shown as "Payment not completed" in history).
- **Acceptance:** replaying the same event does not duplicate items; stock decreases by purchased quantity.

### F11 · Order confirmation & history — P0
- `/checkout/success`: reads `session_id`, polls the order every 1 s up to 10 s until PAID, then shows "Thank you, your order has been placed." with order number, items, total, and "Review or edit your orders" link.
- `/orders`: cards newest first; header strip "ORDER PLACED / TOTAL / SHIP TO / ORDER #"; item thumbnails and titles; status chip (Paid / Pending / Shipped).
- `/orders/[id]`: full detail with address and line items; 404 if not the owner.
- **Acceptance:** order appears within 10 s of payment; non-owner cannot view by guessing id.

### F12 · Loading, empty, error states — P1
- `loading.tsx` with skeletons for `/s`, `/c`, `/dp`, `/orders`.
- Global `error.tsx` ("Sorry, something went wrong on our end") and `not-found.tsx` (Amazon dog page homage, original illustration).
- **Acceptance:** no unstyled white screens or raw stack traces anywhere.

### F13 · Buy Now — P1
- On product page, "Buy Now" creates a single-item checkout without touching the cart (passes `?buyNow=productId&qty=` to checkout which builds a temporary line item).
- **Acceptance:** cart contents unchanged after a Buy Now purchase.

### F14 · Responsive pass — P1
- Breakpoints 390 / 768 / 1024 / 1440. Filter rail becomes a "Filters" drawer under 1024. Product page stacks. Cart summary moves below items.
- **Acceptance:** no horizontal scroll at 390 px; tap targets ≥ 44 px.

### F15 · Search suggestions — P1
- Debounced (200 ms) `GET /api/suggest?q=` after 2 chars; dropdown of up to 6 titles; arrow-key navigation; Enter submits.
- **Acceptance:** no request storm when typing quickly; escape closes.

### F16 · Reviews — P2
- Product page "Customer reviews" section with rating histogram and review list; signed-in users submit one review per product; product `rating` and `reviewCount` recomputed.

### F17 · Wishlist — P2
- Heart toggle on cards and product page; `/wishlist` page; table `Wishlist(userId, productId)`.

### F18 · "Customers also bought" — P2
- 6 random products from the same category, excluding current, under the product page.

---

## 7. Security & correctness
- Passwords hashed with bcrypt; never logged.
- Prices for checkout and orders come only from the database.
- Stripe webhook signature verified; handler idempotent on `stripeSessionId`.
- Orders are scoped by `userId` on every read.
- All form inputs validated with Zod on the server, even when validated on the client.
- `.env*` gitignored; secrets only in Vercel env vars.
- Rate-limit `/api/suggest` to 10 req/s per IP via simple in-memory token bucket (best effort on serverless).

---

## 8. Performance targets
| Metric | Target |
| --- | --- |
| Lighthouse Performance (home, mobile) | ≥ 80 |
| LCP home | < 2.5 s |
| Search query time (194 products) | < 100 ms |
| Product page TTFB | < 300 ms (RSC + Prisma, no client fetch) |
| Bundle | No client component larger than needed; results list is server-rendered |

---

## 9. Testing & QA
Manual QA script run against the deployed URL before submission:

1. Home loads; click a category card → category page.
2. Search "phone" → filter 4 stars & up → sort price high→low → page 2 → copy URL into new tab → identical view.
3. Open a product; swap gallery image; set quantity 2; Add to Cart → badge shows 2.
4. `/cart` shows 2; change to 3; delete; re-add 1.
5. Checkout as guest → redirected to sign-in → register → cart still has 1.
6. Checkout → fill address → Place order → Stripe test page → `4242…` → success page → order number.
7. `/orders` shows order; open detail; totals match.
8. Repeat 6 with `4000 0000 0000 0002` → declined → back on cart.
9. Resize to 390 px and repeat 1–7.
10. Open DevTools console on each page: zero errors.

Automated (if time allows): Vitest unit tests for `money.ts` (tax, shipping) and the cart merge function.

---

## 10. Build schedule (12 h)
| Hours | Block | Exit criteria |
| --- | --- | --- |
| 0:00–0:30 | Brief, screenshots, scope check | Reference folder saved |
| 0:30–1:30 | Scaffold, DB, seed, first deploy | Public URL live; 194 products in DB |
| 1:30–3:00 | F1, F2, F4 | Browsable catalog on live URL |
| 3:00–4:30 | F3 | Shareable search URLs |
| 4:30–6:00 | F5 | Product page complete |
| 6:00–7:30 | F6, F7, F8 | Guest → signed-in cart persists |
| 7:30–9:00 | F9, F10, F11 | End-to-end test purchase |
| 9:00–10:00 | F12, F14, then F13, F15 | Mobile usable, states styled |
| 10:00–11:00 | Fidelity pass, Lighthouse | Side-by-side matches reference |
| 11:00–11:45 | README | Committed |
| 11:45–12:00 | Final deploy, smoke test, submit | Submitted |

**Gate at 7:30:** if F6–F8 aren't done, drop F13, F15, F16–F18 immediately.
**Cut order if behind:** F18, F17, F16, F15, F13, F14. Never cut F9–F11.

---

## 11. Environment variables
| Variable | Where from |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string |
| `DIRECT_URL` | Neon direct connection (migrations) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://<app>.vercel.app` |
| `STRIPE_SECRET_KEY` | Stripe dashboard (test) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe dashboard (test) |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard → Webhooks → endpoint secret |
| `NEXT_PUBLIC_APP_URL` | `https://<app>.vercel.app` |

Local webhook: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

---

## 12. Folder structure
```
app/
  layout.tsx, page.tsx, loading.tsx, error.tsx, not-found.tsx
  s/page.tsx
  c/[slug]/page.tsx
  dp/[slug]/page.tsx
  cart/page.tsx
  checkout/page.tsx
  checkout/success/page.tsx
  orders/page.tsx
  orders/[id]/page.tsx
  signin/page.tsx
  register/page.tsx
  wishlist/page.tsx                (P2)
  api/checkout/route.ts
  api/webhooks/stripe/route.ts
  api/suggest/route.ts
  api/auth/[...nextauth]/route.ts
components/
  Header.tsx SearchBar.tsx ProductCard.tsx Price.tsx Stars.tsx
  FilterRail.tsx SortSelect.tsx Pagination.tsx Gallery.tsx BuyBox.tsx
  CartLine.tsx EmptyState.tsx skeletons/
lib/
  db.ts auth.ts stripe.ts money.ts search.ts slug.ts
store/cart.ts
actions/cart.ts actions/auth.ts actions/review.ts
prisma/schema.prisma prisma/seed.ts prisma/migrations/
middleware.ts
```

---

## 13. README outline (written at hour 11)
1. What this is and the live URL
2. Stack and why
3. Architecture diagram and request flows
4. Running locally (env, migrate, seed, stripe listen)
5. Test purchase instructions
6. What was cut and why
7. What I'd build with one more day
