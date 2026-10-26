import Image from "next/image";
import Link from "next/link";
import type { CardProduct } from "@/lib/catalog";
import { boughtLabel, deliveryDate, deliveryDays } from "@/lib/format";
import { discountPercent } from "@/lib/money";
import { AddToCartButton } from "./AddToCartButton";
import { DealBadge, ProductBadge } from "./Badge";
import { ListPrice, PriceText } from "./Price";
import { Stars } from "./Stars";

/** Search-results card (F3): image, badge, title, stars, bought-in-past-month, price, delivery, Add to cart. */
export function ProductCard({ product: p, priority = false }: { product: CardProduct; priority?: boolean }) {
  const pct = discountPercent(p.priceCents, p.listPriceCents);
  const bought = boughtLabel(p.soldLastMonth);
  const href = `/dp/${p.slug}`;
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-sm border border-[#e7e7e7] bg-white">
      <Link href={href} className="relative flex aspect-square items-center justify-center bg-[#f7f7f7] p-4" tabIndex={-1}>
        <Image
          src={p.thumbnail}
          alt={p.title}
          width={300}
          height={300}
          priority={priority}
          sizes="(min-width: 1280px) 260px, (min-width: 768px) 30vw, 45vw"
          className="h-full w-full object-contain mix-blend-multiply"
        />
        {p.badge && (
          <span className="absolute left-0 top-0">
            <ProductBadge badge={p.badge} />
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 px-3 pb-3 pt-2">
        <Link href={href} className="line-clamp-3 text-[15px] leading-[20px] text-amz-text hover:text-amz-link-hover md:text-base md:leading-6">
          {p.title}
        </Link>
        <Stars rating={p.rating} count={p.reviewCount} href={`${href}#reviews`} showValue />
        {bought && <p className="text-[13px] text-amz-muted">{bought}</p>}
        {pct > 0 && <DealBadge pct={pct} />}
        <div className="flex flex-wrap items-baseline gap-x-1.5">
          <PriceText cents={p.priceCents} />
          <ListPrice priceCents={p.priceCents} listPriceCents={p.listPriceCents} label="List:" />
        </div>
        <p className="text-[13px] leading-[18px] text-amz-text">
          {p.priceCents >= 3500 ? (
            <>
              FREE delivery <span className="font-bold">{deliveryDate(deliveryDays(p.id))}</span>
            </>
          ) : (
            <>
              FREE delivery <span className="font-bold">{deliveryDate(deliveryDays(p.id))}</span> on $35 of items
            </>
          )}
        </p>
        {p.stock > 0 && p.stock <= 5 && <p className="text-[13px] text-amz-price">Only {p.stock} left in stock - order soon.</p>}
        <div className="mt-auto pt-1.5">
          <AddToCartButton product={p} />
        </div>
      </div>
    </article>
  );
}

/** Compact tile for the home page's horizontal rows. */
export function ProductTile({ product: p }: { product: CardProduct }) {
  const pct = discountPercent(p.priceCents, p.listPriceCents);
  return (
    <Link href={`/dp/${p.slug}`} className="group flex w-[170px] shrink-0 flex-col gap-1.5 md:w-[200px]">
      <span className="flex h-[170px] items-center justify-center bg-[#f7f7f7] p-3 md:h-[200px]">
        <Image
          src={p.thumbnail}
          alt={p.title}
          width={200}
          height={200}
          sizes="200px"
          className="h-full w-full object-contain mix-blend-multiply"
        />
      </span>
      {pct > 0 && <DealBadge pct={pct} />}
      <span className="flex items-baseline gap-1.5">
        <PriceText cents={p.priceCents} />
        <ListPrice priceCents={p.priceCents} listPriceCents={p.listPriceCents} />
      </span>
      <span className="line-clamp-2 text-sm text-amz-text group-hover:text-amz-link-hover">{p.title}</span>
    </Link>
  );
}
