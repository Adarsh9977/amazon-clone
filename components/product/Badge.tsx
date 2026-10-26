import type { Badge as BadgeKind } from "@prisma/client";
import { BADGE_LABEL } from "@/lib/format";

/** Best Seller (orange), Overall Pick (dark), Amazon's Choice (navy). Findings #4. */
export function ProductBadge({ badge }: { badge: BadgeKind | null }) {
  if (!badge) return null;
  if (badge === "BEST_SELLER")
    return (
      <span className="inline-block rounded-br-md rounded-tl-sm bg-amz-badge-best px-1.5 py-[3px] text-xs leading-none text-white">
        {BADGE_LABEL[badge]}
      </span>
    );
  if (badge === "AMAZONS_CHOICE")
    return (
      <span className="inline-block rounded-br-md rounded-tl-sm bg-amz-badge-choice px-1.5 py-[3px] text-xs leading-none text-white">
        Amazon&apos;s <span className="text-amz-orange">Choice</span>
      </span>
    );
  return (
    <span className="inline-block rounded-br-md rounded-tl-sm bg-amz-navy px-1.5 py-[3px] text-xs leading-none text-white">
      {BADGE_LABEL[badge]}
    </span>
  );
}

export function DealBadge({ pct }: { pct: number }) {
  return (
    <span className="flex items-center gap-2 text-xs">
      <span className="rounded-sm bg-amz-deal px-1.5 py-1 font-bold leading-none text-white">{pct}% off</span>
      <span className="font-bold text-amz-deal">Limited time deal</span>
    </span>
  );
}
