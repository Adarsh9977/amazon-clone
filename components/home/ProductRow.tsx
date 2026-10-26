import Link from "next/link";
import type { CardProduct } from "@/lib/catalog";
import { ProductTile } from "../product/ProductCard";

export function ProductRow({ title, href, products }: { title: string; href: string; products: CardProduct[] }) {
  if (!products.length) return null;
  return (
    <section className="bg-white px-4 py-5 md:px-5">
      <div className="mb-3 flex items-baseline gap-4">
        <h2 className="text-[21px] font-bold leading-7">{title}</h2>
        <Link href={href} className="text-sm text-amz-link hover:text-amz-link-hover hover:underline">
          See all
        </Link>
      </div>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
        {products.map((p) => (
          <ProductTile key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
