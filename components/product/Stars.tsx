import Link from "next/link";
import { compactCount } from "@/lib/format";

function StarRow({ filled }: { filled: boolean }) {
  return (
    <span className="flex">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-[15px] w-[15px] shrink-0" aria-hidden>
          <path
            d="M10 1.6l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.5l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z"
            fill={filled ? "#de7921" : "#fff"}
            stroke="#de7921"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  );
}

/** 5 stars rounded to the nearest half, plus optional count. A clipped overlay avoids SVG ids. */
export function Stars({ rating, count, href, showValue = false }: { rating: number; count?: number; href?: string; showValue?: boolean }) {
  const half = Math.round(rating * 2) / 2;
  const stars = (
    <span className="relative inline-block" role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      <StarRow filled={false} />
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${(half / 5) * 100}%` }}>
        <StarRow filled />
      </span>
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      {showValue && <span className="text-amz-text">{rating.toFixed(1)}</span>}
      {stars}
      {count != null &&
        (href ? (
          <Link href={href} className="text-amz-link hover:text-amz-link-hover hover:underline">
            ({compactCount(count)})
          </Link>
        ) : (
          <span className="text-amz-link">({compactCount(count)})</span>
        ))}
    </span>
  );
}
