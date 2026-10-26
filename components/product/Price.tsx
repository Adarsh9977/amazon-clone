import { discountPercent, formatCents, priceParts } from "@/lib/money";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { whole: string; sup: string }> = {
  // Superscripts sit at the cap height of the dollars: flex items-start puts them at the line top.
  sm: { whole: "text-[21px] leading-[21px]", sup: "text-[12px] leading-[12px] top-[1px]" },
  md: { whole: "text-[28px] leading-[28px]", sup: "text-[13px] leading-[13px] top-[2px]" },
  lg: { whole: "text-[28px] leading-[32px]", sup: "text-[13px] leading-[13px] top-[4px]" },
};

/** Superscript $ + big dollars + superscript cents, like the live site (findings #5). */
export function PriceText({ cents, size = "sm", className = "" }: { cents: number; size?: Size; className?: string }) {
  const { whole, fraction } = priceParts(cents);
  const s = SIZES[size];
  return (
    <span className={`inline-flex items-start text-amz-text ${className}`} aria-label={formatCents(cents)}>
      <span className={`relative ${s.sup}`} aria-hidden>
        $
      </span>
      <span className={`font-medium ${s.whole}`} aria-hidden>
        {whole}
      </span>
      <span className={`relative ${s.sup}`} aria-hidden>
        {fraction}
      </span>
    </span>
  );
}

export function ListPrice({ priceCents, listPriceCents, label = "List:" }: { priceCents: number; listPriceCents: number | null; label?: string }) {
  if (!listPriceCents || listPriceCents <= priceCents) return null;
  return (
    <span className="text-xs text-amz-muted">
      {label} <span className="line-through">{formatCents(listPriceCents)}</span>
    </span>
  );
}

export function DiscountPercent({ priceCents, listPriceCents, className = "" }: { priceCents: number; listPriceCents: number | null; className?: string }) {
  const pct = discountPercent(priceCents, listPriceCents);
  if (!pct) return null;
  return <span className={`font-light text-amz-deal ${className}`}>-{pct}%</span>;
}
