import Image from "next/image";
import Link from "next/link";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ProductRow } from "@/components/home/ProductRow";
import { getCategoryImages, getHomeRows, heroSlides, homeCards, type HomeCard } from "@/lib/catalog";

// Catalog changes only on reseed; rebuild the page at most every 10 minutes.
export const revalidate = 600;

function GridCard({ card, images }: { card: HomeCard; images: Map<string, string[]> }) {
  const used = new Map<string, number>();
  return (
    <section className="flex flex-col bg-white p-5">
      <h2 className="mb-3 text-[21px] font-bold leading-7">{card.title}</h2>
      <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3">
        {card.cards.map((slug, i) => {
          // A card can repeat a category; show its next image so the grid doesn't duplicate.
          const n = used.get(slug) ?? 0;
          used.set(slug, n + 1);
          const list = images.get(slug) ?? [];
          const src = list[n % Math.max(list.length, 1)];
          return (
            <Link key={i} href={`/c/${slug}`} className="group flex flex-col gap-1">
              <span className="flex aspect-square items-center justify-center bg-[#f7f7f7] p-2">
                {src && (
                  <Image src={src} alt="" width={160} height={160} sizes="160px" className="h-full w-full object-contain mix-blend-multiply" />
                )}
              </span>
              <span className="text-xs text-amz-text group-hover:text-amz-link-hover">{card.labels[i]}</span>
            </Link>
          );
        })}
      </div>
      <Link href={`/c/${card.cards[0]}`} className="mt-4 text-[13px] text-amz-link hover:text-amz-link-hover hover:underline">
        See more
      </Link>
    </section>
  );
}

export default async function HomePage() {
  const slugs = [...new Set(homeCards.flatMap((c) => c.cards))];
  const [images, rows] = await Promise.all([getCategoryImages(slugs), getHomeRows()]);

  return (
    <div className="bg-amz-bg">
      <div className="mx-auto max-w-[1500px]">
        <HeroCarousel slides={heroSlides} />
        {/* Cards overlap the bottom of the hero on desktop (findings #13). */}
        <div className="relative z-10 grid grid-cols-1 gap-5 px-3 pt-4 sm:grid-cols-2 lg:-mt-[330px] lg:grid-cols-4 lg:px-5 lg:pt-0">
          {homeCards.slice(0, 4).map((c) => (
            <GridCard key={c.title} card={c} images={images} />
          ))}
        </div>
        <div className="mt-5 space-y-5 px-3 lg:px-5">
          <ProductRow title="Today's Deals" href="/s?deals=1" products={rows.deals} />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {homeCards.slice(4, 8).map((c) => (
              <GridCard key={c.title} card={c} images={images} />
            ))}
          </div>
          <ProductRow title="Top rated by customers" href="/s?rating=4&sort=rating" products={rows.topRated} />
          <ProductRow title="Best Sellers in Electronics" href="/c/electronics?sort=best" products={rows.bestSellers} />
        </div>
      </div>
    </div>
  );
}
