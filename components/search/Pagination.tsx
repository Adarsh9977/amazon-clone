import Link from "next/link";
import { ChevronIcon } from "../icons";

/** "‹ Previous 1 2 3 … 20 Next ›" (findings #1). */
export function Pagination({ page, totalPages, href }: { page: number; totalPages: number; href: (page: number) => string }) {
  if (totalPages <= 1) return null;
  const pages = new Set([1, totalPages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= totalPages));
  if (page <= 3) [2, 3].forEach((n) => n <= totalPages && pages.add(n));
  const sorted = [...pages].sort((a, b) => a - b);

  const cell = "flex h-10 min-w-10 items-center justify-center px-3 text-sm";
  return (
    <nav aria-label="Pagination" className="flex justify-center">
      <ul className="flex items-center overflow-hidden rounded-lg border border-amz-border bg-white">
        <li className="border-r border-amz-border">
          {page > 1 ? (
            <Link href={href(page - 1)} className={`${cell} gap-1 hover:bg-[#f7fafa]`}>
              <ChevronIcon dir="left" className="h-3.5 w-3.5" /> Previous
            </Link>
          ) : (
            <span className={`${cell} gap-1 text-[#999]`}>
              <ChevronIcon dir="left" className="h-3.5 w-3.5" /> Previous
            </span>
          )}
        </li>
        {sorted.map((n, i) => (
          <li key={n} className="flex">
            {i > 0 && n - sorted[i - 1] > 1 && <span className={`${cell} text-[#999]`}>…</span>}
            {n === page ? (
              <span aria-current="page" className={`${cell} border border-amz-text font-bold`}>
                {n}
              </span>
            ) : (
              <Link href={href(n)} className={`${cell} hover:bg-[#f7fafa]`}>
                {n}
              </Link>
            )}
          </li>
        ))}
        <li className="border-l border-amz-border">
          {page < totalPages ? (
            <Link href={href(page + 1)} className={`${cell} gap-1 hover:bg-[#f7fafa]`}>
              Next <ChevronIcon dir="right" className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <span className={`${cell} gap-1 text-[#999]`}>
              Next <ChevronIcon dir="right" className="h-3.5 w-3.5" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
