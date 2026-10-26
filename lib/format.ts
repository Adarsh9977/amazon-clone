// Display helpers that copy the live site's wording (docs/live-site-findings.md).

const SOLD_BUCKETS = [10000, 5000, 2000, 1000, 500, 100, 50];

/** "5K+ bought in past month", bucketed like the live site. Null below 50. */
export function boughtLabel(soldLastMonth: number): string | null {
  const b = SOLD_BUCKETS.find((n) => soldLastMonth >= n);
  if (!b) return null;
  return `${b >= 1000 ? `${b / 1000}K` : b}+ bought in past month`;
}

export function compactCount(n: number): string {
  return n.toLocaleString("en-US");
}

/** Delivery date shown on cards and the buy box: today + days, e.g. "Thu, Oct 29". */
export function deliveryDate(daysFromNow: number, now = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + daysFromNow);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** Stable per-product delivery offset (3–6 days) so a card doesn't change between renders. */
export function deliveryDays(productId: number): number {
  return 3 + (productId % 4);
}

export const BADGE_LABEL = {
  BEST_SELLER: "Best Seller",
  OVERALL_PICK: "Overall Pick",
  AMAZONS_CHOICE: "Amazon's Choice",
} as const;
