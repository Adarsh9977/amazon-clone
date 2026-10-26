# What amazon.com actually does (observed 23 Oct 2026)

Walked home, search (`/s?k=headphones`), product (`/dp/B0CCZ1L489`) and cart pages in a real browser. Where this file and `spec.md` disagree, **this file wins**.

| # | Observed on amazon.com | What we do | Spec impact |
| --- | --- | --- | --- |
| 1 | Header reads "1-16 of over 100,000 results for "headphones"". Page size 16. Pagination "Previous 1 2 3 … 20 Next", capped at 20 pages | Page size 16, cap 20 pages, copy wording | F3 |
| 2 | Sort options exactly: Featured, Price: Low to High, Price: High to Low, Avg. Customer Review, Newest Arrivals, Best Sellers | Same six labels. Featured = relevance, Best Sellers = `soldLastMonth desc`, Newest = `createdAt desc` | F3 |
| 3 | Social proof on every card: "5K+ bought in past month", bucketed | `Product.soldLastMonth`; UI buckets 50+/100+/500+/1K+/2K+/5K+/10K+ | Schema |
| 4 | Badges above title: Best Seller (orange), Overall Pick (dark), Amazon's Choice (navy), "Limited time deal" (red text) | `Product.badge` enum; "Limited time deal" derived from `listPriceCents > priceCents` | Schema |
| 5 | Price typeset as superscript $ + big integer + superscript cents; "List: $239.99" struck through; "-29%" in red on PDP | `Price` component renders 3 spans; discount = round((list − price) / list × 100) | F5 |
| 6 | Delivery line on cards ("FREE delivery Thu, Oct 29" for US) | Show FREE delivery, date = today + 3–6 days | F3, F5 |
| 7 | Cards with variants show "See options" and "+12 other colors/patterns" | No variants. Always price + Add to cart. README says so | README |
| 8 | Filter rail order: Popular Shopping Ideas, Price (slider + 4 ranges), Deals & Discounts, Brands (7 + See more), Customer Review ("4 Stars & Up"), Condition, then ~30 category facets | Price, Deals, Brands (top 7, checkboxes), 4 Stars & Up. `brand`, `deals` URL params | F3 |
| 9 | "Related searches" chip row above pagination; sub-nav is a horizontal scroller (All, Today's Deals, …) | 6 related category chips; 12-link scrolling sub-nav | F1, F3 |
| 10 | PDP breadcrumb (Electronics › … › Over-Ear Headphones), "Visit the Bose Store" link, key-spec table above "About this item" | Breadcrumb from category parent chain; brand link → `/s?brand=`; 4-row spec table | F5 |
| 11 | Reviews: "4.2 out of 5 stars", "10,155 global ratings", 5-row % histogram, "Customers say" summary, aspect chips | Histogram + top reviews from seeded reviews (read-only is P1, posting is P2) | F16 |
| 12 | Empty cart copy: "Your Amazon Cart is empty", "Shop today's deals", "Sign in to your account" / "Sign up now", grey legal line about price and availability | Copy verbatim | F6 |
| 13 | Home: full-bleed hero carousel fading into the page; rows of 4 cards overlap the hero, each a 2×2 image grid + "See more" | 2 rows of 4 cards, 2×2 grids (groupings in `docs/seed/categories.json`) | F2 |
| 14 | Geo banner for non-US visitors; PDP hides the buy box when item can't ship there | Always render US view; mention in README | README |

Skipped on purpose: sponsored results (~1 in 3 cards), the deal countdown in the sub-nav, Prime.

Recon tip: set delivery to a US ZIP (Deliver to → enter ZIP) before screenshotting, otherwise the PDP buy box doesn't render.
