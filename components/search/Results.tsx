import Link from "next/link";
import { getDepartments } from "@/lib/catalog";
import { PAGE_SIZE, SORTS, searchHref, type SearchParams, type SearchResult } from "@/lib/search";
import { ProductCard } from "../product/ProductCard";
import { FilterRail } from "./FilterRail";
import { Pagination } from "./Pagination";
import { SortSelect } from "./SortSelect";

type Patch = Parameters<typeof searchHref>[1];

/**
 * Shared results view for /s (F3) and /c/[slug] (F4).
 * On /c pages the category lives in the path, so `fixedCat` keeps it out of the query string.
 */
export async function Results({
  result,
  fixedCat,
  heading,
  breadcrumb,
}: {
  result: SearchResult;
  fixedCat?: string;
  heading?: string;
  breadcrumb?: React.ReactNode;
}) {
  const departments = await getDepartments();
  const { params: p, products, total, page, totalPages, facets } = result;

  const base = fixedCat ? `/c/${fixedCat}` : "/s";
  const current: Partial<SearchParams> = fixedCat ? { ...p, cat: undefined } : p;
  const href = (patch: Patch) => searchHref(current, patch, base);
  // Switching category: path-based when browsing a category without a query, ?cat= otherwise.
  const catHref = (slug: string | undefined) =>
    fixedCat && !p.k
      ? slug
        ? searchHref(current, {}, `/c/${slug}`)
        : searchHref(current, {}, "/s")
      : searchHref({ ...p, cat: undefined }, { cat: slug }, "/s");

  const from = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(page * PAGE_SIZE, total);
  const sortOptions = SORTS.map((s) => ({ ...s, href: href({ sort: s.value }) }));
  const anyFilter = p.brand.length || p.min != null || p.max != null || p.rating || p.deals;
  const related = facets.categories
    .filter((c) => c.slug !== p.cat)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const rail = <FilterRail params={p} facets={facets} departments={departments} href={href} catHref={catHref} />;

  return (
    <div>
      {/* Results bar: "1-16 of 87 results for "headphones"" + sort (findings #1, #2). */}
      <div className="border-b border-[#ddd] bg-white shadow-[0_2px_4px_rgba(0,0,0,.06)]">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-2 px-3 py-2 md:px-5">
          <p className="text-sm">
            {total ? (
              <>
                {from}-{to} of {total > PAGE_SIZE * 20 ? "over " : ""}
                {total.toLocaleString("en-US")} results
              </>
            ) : (
              "No results"
            )}
            {(p.k || heading) && (
              <>
                {" "}
                for{" "}
                <span className="font-bold text-amz-link-hover">{p.k ? `"${p.k}"` : heading}</span>
              </>
            )}
          </p>
          <SortSelect current={p.sort} options={sortOptions} />
        </div>
      </div>

      <div className="mx-auto flex max-w-[1500px] gap-6 px-3 pt-3 md:px-5">
        <aside aria-label="Filters" className="hidden w-[220px] shrink-0 lg:block">
          {rail}
        </aside>

        <div className="min-w-0 flex-1">
          {breadcrumb}
          {/* F14: under 1024px the rail becomes a Filters drawer. */}
          <details className="mb-3 rounded-lg border border-amz-border bg-white lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-bold">
              Filters{anyFilter ? " (active)" : ""}
              <span className="text-xs font-normal text-amz-link">Show</span>
            </summary>
            <div className="border-t border-amz-border px-3 py-3">{rail}</div>
          </details>

          {products.length ? (
            <>
              <h2 className="text-xl font-bold leading-7">Results</h2>
              <p className="mb-3 text-sm text-amz-muted">Check each product page for other buying options.</p>
              <ul className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
                {products.map((prod, i) => (
                  <li key={prod.id}>
                    <ProductCard product={prod} priority={i < 4} />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="py-10">
              <h2 className="text-xl font-bold">
                {p.k ? (
                  <>
                    No results for <span className="text-amz-link-hover">{p.k}</span>.
                  </>
                ) : (
                  "No results."
                )}
              </h2>
              <p className="mt-1 text-sm">Try checking your spelling or use more general terms.</p>
              {anyFilter ? (
                <Link
                  href={href({ brand: [], min: undefined, max: undefined, rating: undefined, deals: false })}
                  className="mt-3 inline-block text-sm text-amz-link hover:underline"
                >
                  Clear all filters
                </Link>
              ) : null}
            </div>
          )}

          {related.length > 0 && products.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-2 text-base font-bold">Related searches</h2>
              <ul className="flex flex-wrap gap-2">
                {related.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/c/${c.slug}`}
                      className="flex items-center gap-1.5 rounded-full border border-amz-border bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-[#f7fafa]"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#777]" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                        <circle cx="10.5" cy="10.5" r="6.5" />
                        <path d="M15.5 15.5 21 21" />
                      </svg>
                      {c.name.toLowerCase()}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-8">
            <Pagination page={page} totalPages={totalPages} href={(n) => href({ page: n })} />
          </div>
        </div>
      </div>
    </div>
  );
}
