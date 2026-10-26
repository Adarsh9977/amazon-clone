import Link from "next/link";
import type { Facets, SearchParams } from "@/lib/search";
import { ChevronIcon } from "../icons";
import { Stars } from "../product/Stars";
import { PriceRangeForm } from "./PriceRangeForm";

type Dept = { slug: string; name: string; children: { slug: string; name: string }[] };
type Patch = Parameters<typeof import("@/lib/search-params").searchHref>[1];

export type RailProps = {
  params: SearchParams;
  facets: Facets;
  departments: Dept[];
  /** Builds a URL for the current view with some params changed. */
  href: (patch: Patch) => string;
  /** Builds a URL that switches category (path-based on /c pages, ?cat= on /s). */
  catHref: (slug: string | undefined) => string;
};

const PRICE_RANGES = [
  { label: "Under $25", min: undefined, max: 25 },
  { label: "$25 to $50", min: 25, max: 50 },
  { label: "$50 to $100", min: 50, max: 100 },
  { label: "$100 to $200", min: 100, max: 200 },
  { label: "$200 & Above", min: 200, max: undefined },
];

function H({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-1.5 text-base font-bold leading-6">{children}</h3>;
}

function Check({ on, href, children }: { on: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link href={href} role="checkbox" aria-checked={on} scroll={false} className="group flex items-center gap-2 py-[3px] text-sm">
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border ${
          on ? "border-amz-link bg-amz-link" : "border-[#888c8c] bg-white group-hover:border-amz-text"
        }`}
      >
        {on && (
          <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
            <path d="M2.5 6.2 5 8.5l4.5-5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </svg>
        )}
      </span>
      <span className="group-hover:text-amz-link-hover">{children}</span>
    </Link>
  );
}

/** Left rail (F3 + findings #8): Department, Price, Deals, Brands, Customer Reviews. All plain links: URL is the state. */
export function FilterRail({ params, facets, departments, href, catHref }: RailProps) {
  const counts = new Map(facets.categories.map((c) => [c.slug, c.count]));
  const deptCount = (d: Dept) => d.children.reduce((n, c) => n + (counts.get(c.slug) ?? 0), 0);
  const currentDept = departments.find((d) => d.slug === params.cat || d.children.some((c) => c.slug === params.cat));
  const currentLeaf = currentDept?.children.find((c) => c.slug === params.cat);

  const activeRange = PRICE_RANGES.find((r) => r.min === params.min && r.max === params.max);
  const hasPrice = params.min != null || params.max != null;
  const brands = facets.brands;
  // Selected brands always stay visible even when they aren't in the top 7.
  const top = brands.slice(0, 7);
  const extra = brands.slice(7).filter((b) => !params.brand.includes(b.brand));
  const pinned = brands.slice(7).filter((b) => params.brand.includes(b.brand));
  const toggleBrand = (b: string) =>
    href({ brand: params.brand.includes(b) ? params.brand.filter((x) => x !== b) : [...params.brand, b] });

  return (
    <div className="space-y-5 text-sm">
      <section>
        <H>Department</H>
        <ul className="space-y-0.5">
          {currentDept ? (
            <>
              <li>
                <Link href={catHref(undefined)} className="flex items-center gap-0.5 hover:text-amz-link-hover">
                  <ChevronIcon dir="left" className="h-3 w-3" /> Any Department
                </Link>
              </li>
              {currentLeaf ? (
                <>
                  <li>
                    <Link href={catHref(currentDept.slug)} className="flex items-center gap-0.5 hover:text-amz-link-hover">
                      <ChevronIcon dir="left" className="h-3 w-3" /> {currentDept.name}
                    </Link>
                  </li>
                  <li className="pl-4 font-bold">{currentLeaf.name}</li>
                </>
              ) : (
                <>
                  <li className="pl-1 font-bold">{currentDept.name}</li>
                  {currentDept.children
                    .filter((c) => counts.get(c.slug))
                    .map((c) => (
                      <li key={c.slug} className="pl-4">
                        <Link href={catHref(c.slug)} className="hover:text-amz-link-hover">
                          {c.name} <span className="text-amz-muted">({counts.get(c.slug)})</span>
                        </Link>
                      </li>
                    ))}
                </>
              )}
            </>
          ) : (
            departments
              .filter((d) => deptCount(d) > 0)
              .map((d) => (
                <li key={d.slug}>
                  <Link href={catHref(d.slug)} className="hover:text-amz-link-hover">
                    {d.name} <span className="text-amz-muted">({deptCount(d)})</span>
                  </Link>
                </li>
              ))
          )}
        </ul>
      </section>

      <section>
        <H>Customer Reviews</H>
        <ul className="space-y-1">
          {[4, 3, 2, 1].map((r) => (
            <li key={r}>
              <Link
                href={href({ rating: params.rating === r ? undefined : r })}
                scroll={false}
                aria-current={params.rating === r}
                className={`flex items-center gap-1 hover:text-amz-link-hover ${params.rating === r ? "font-bold" : ""}`}
              >
                <Stars rating={r} /> <span>&amp; Up</span>
              </Link>
            </li>
          ))}
        </ul>
        {params.rating && (
          <Link href={href({ rating: undefined })} scroll={false} className="mt-1 block text-xs text-amz-link hover:underline">
            Clear
          </Link>
        )}
      </section>

      <section>
        <H>Price</H>
        <ul className="space-y-1">
          {PRICE_RANGES.map((r) => (
            <li key={r.label}>
              <Link
                href={activeRange === r ? href({ min: undefined, max: undefined }) : href({ min: r.min, max: r.max })}
                scroll={false}
                aria-current={activeRange === r}
                className={`hover:text-amz-link-hover ${activeRange === r ? "font-bold" : ""}`}
              >
                {r.label}
              </Link>
            </li>
          ))}
        </ul>
        <PriceRangeForm min={params.min} max={params.max} hrefTemplate={href({ min: "__MIN__", max: "__MAX__" })} />
        {hasPrice && (
          <Link href={href({ min: undefined, max: undefined })} scroll={false} className="mt-1 block text-xs text-amz-link hover:underline">
            Clear
          </Link>
        )}
      </section>

      <section>
        <H>Deals &amp; Discounts</H>
        <Check on={params.deals} href={href({ deals: !params.deals })}>
          Today&apos;s Deals
        </Check>
      </section>

      {brands.length > 0 && (
        <section>
          <H>Brands</H>
          {[...top, ...pinned].map((b) => (
            <Check key={b.brand} on={params.brand.includes(b.brand)} href={toggleBrand(b.brand)}>
              {b.brand}
            </Check>
          ))}
          {extra.length > 0 && (
            <details className="group">
              <summary className="mt-1 flex cursor-pointer list-none items-center gap-1 text-amz-link hover:text-amz-link-hover hover:underline">
                <ChevronIcon className="h-3 w-3 group-open:rotate-180" />
                <span className="group-open:hidden">See more</span>
                <span className="hidden group-open:inline">See less</span>
              </summary>
              {extra.map((b) => (
                <Check key={b.brand} on={false} href={toggleBrand(b.brand)}>
                  {b.brand}
                </Check>
              ))}
            </details>
          )}
        </section>
      )}
    </div>
  );
}
