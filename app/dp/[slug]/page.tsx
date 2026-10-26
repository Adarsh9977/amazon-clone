import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductRow } from "@/components/home/ProductRow";
import { CheckIcon } from "@/components/icons";
import { DealBadge, ProductBadge } from "@/components/product/Badge";
import { BuyBox } from "@/components/product/BuyBox";
import { Gallery } from "@/components/product/Gallery";
import { DiscountPercent, ListPrice, PriceText } from "@/components/product/Price";
import { Stars } from "@/components/product/Stars";
import { boughtLabel, compactCount } from "@/lib/format";
import { discountPercent } from "@/lib/money";
import { getProduct, getRelated, getReviewSummary } from "@/lib/product";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return { title: "Not found" };
  return {
    title: p.title,
    description: p.description.slice(0, 160),
    openGraph: { title: p.title, images: [p.images[0] ?? p.thumbnail] },
  };
}

export default async function ProductPage({ params }: Props) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const [{ histogram, reviews }, related] = await Promise.all([getReviewSummary(p.id), getRelated(p.id, p.categoryId)]);

  const pct = discountPercent(p.priceCents, p.listPriceCents);
  const bought = boughtLabel(p.soldLastMonth);
  const images = p.images.length ? p.images : [p.thumbnail];
  const cartable = { id: p.id, slug: p.slug, title: p.title, thumbnail: p.thumbnail, priceCents: p.priceCents, stock: p.stock };

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-3 md:px-5">
      {/* Breadcrumb from the category parent chain (findings #10). */}
      <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap gap-1 text-xs text-amz-muted">
        {p.category.parent && (
          <>
            <Link href={`/c/${p.category.parent.slug}`} className="hover:text-amz-link-hover hover:underline">
              {p.category.parent.name}
            </Link>
            <span>›</span>
          </>
        )}
        <Link href={`/c/${p.category.slug}`} className="hover:text-amz-link-hover hover:underline">
          {p.category.name}
        </Link>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_244px]">
        <Gallery images={images} title={p.title} />

        <div className="min-w-0">
          <h1 className="text-[22px] leading-8 md:text-2xl">{p.title}</h1>
          <Link href={`/s?brand=${encodeURIComponent(p.brand)}`} className="text-sm text-amz-link hover:text-amz-link-hover hover:underline">
            Visit the {p.brand} Store
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Stars rating={p.rating} showValue />
            <a href="#reviews" className="text-sm text-amz-link hover:text-amz-link-hover hover:underline">
              {compactCount(p.reviewCount)} ratings
            </a>
          </div>
          {p.badge && (
            <div className="mt-1.5">
              <ProductBadge badge={p.badge} />
            </div>
          )}
          {bought && <p className="mt-1.5 text-sm text-amz-muted">{bought}</p>}

          <hr className="my-3 border-[#ddd]" />

          {pct > 0 && (
            <div className="mb-1">
              <DealBadge pct={pct} />
            </div>
          )}
          <div className="flex items-start gap-2">
            <DiscountPercent priceCents={p.priceCents} listPriceCents={p.listPriceCents} className="text-[28px] leading-8" />
            <PriceText cents={p.priceCents} size="lg" />
          </div>
          <ListPrice priceCents={p.priceCents} listPriceCents={p.listPriceCents} label="List Price:" />

          {/* Key-spec table above "About this item" (findings #10). */}
          <table className="mt-4 text-sm">
            <tbody>
              {[
                ["Brand", p.brand],
                ["Category", p.category.name],
                ["Customer Reviews", `${p.rating.toFixed(1)} out of 5 stars`],
                ["Availability", p.stock > 0 ? `${p.stock} in stock` : "Out of stock"],
              ].map(([k, v]) => (
                <tr key={k}>
                  <th className="w-[140px] py-1 pr-4 text-left align-top font-bold">{k}</th>
                  <td className="py-1">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <hr className="my-4 border-[#ddd]" />
          <h2 className="text-base font-bold">About this item</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {p.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>

        <aside className="lg:sticky lg:top-[115px] lg:self-start">
          <BuyBox product={cartable} />
        </aside>
      </div>

      <hr className="my-6 border-[#ddd]" />
      <section className="max-w-[1000px]">
        <h2 className="text-2xl font-bold">Product description</h2>
        <p className="mt-2 text-sm leading-6">{p.description}</p>
      </section>

      {related.length > 0 && (
        <>
          <hr className="my-6 border-[#ddd]" />
          <div className="-mx-4 md:-mx-5">
            <ProductRow title="Products related to this item" href={`/c/${p.category.slug}`} products={related} />
          </div>
        </>
      )}

      <hr className="my-6 border-[#ddd]" />
      {/* F16 read-only: histogram + recent reviews from the seed (findings #11). */}
      <section id="reviews" className="grid scroll-mt-32 gap-8 md:grid-cols-[300px_1fr]">
        <div>
          <h2 className="text-2xl font-bold">Customer reviews</h2>
          <div className="mt-2 flex items-center gap-2">
            <Stars rating={p.rating} />
            <span className="text-lg">{p.rating.toFixed(1)} out of 5</span>
          </div>
          <p className="mt-1 text-sm text-amz-muted">{compactCount(p.reviewCount)} global ratings</p>
          <ul className="mt-4 space-y-3">
            {histogram.map((h) => (
              <li key={h.star} className="flex items-center gap-3 text-sm">
                <span className="w-12 shrink-0 text-amz-link">{h.star} star</span>
                <span className="h-5 flex-1 overflow-hidden rounded border border-[#d5d9d9] bg-[#f0f2f2] shadow-inner">
                  <span className="block h-full bg-amz-star" style={{ width: `${h.pct}%` }} />
                </span>
                <span className="w-9 shrink-0 text-right text-amz-link">{h.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-bold">Top reviews from the United States</h3>
          {reviews.length === 0 && <p className="mt-2 text-sm text-amz-muted">No reviews yet.</p>}
          <ul className="mt-3 space-y-6">
            {reviews.map((r) => (
              <li key={r.id}>
                <p className="flex items-center gap-2 text-[13px]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e3e6e6] text-xs font-bold text-amz-muted">
                    {r.reviewerName
                      .split(" ")
                      .map((s) => s[0])
                      .join("")}
                  </span>
                  {r.reviewerName}
                </p>
                <p className="mt-1 flex items-center gap-2">
                  <Stars rating={r.rating} />
                  <span className="text-sm font-bold">{r.title}</span>
                </p>
                <p className="text-[13px] text-amz-muted">
                  Reviewed in the United States on{" "}
                  {r.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
                {r.verified && (
                  <p className="flex items-center gap-1 text-xs font-bold text-amz-link-hover">
                    <CheckIcon className="h-3 w-3" /> Verified Purchase
                  </p>
                )}
                <p className="mt-1 text-sm">{r.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
