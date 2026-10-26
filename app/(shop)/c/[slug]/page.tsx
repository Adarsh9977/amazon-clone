import type { Metadata } from "next";
import Link from "next/link";
import { Results } from "@/components/search/Results";
import { getCategory } from "@/lib/catalog";
import { parseSearchParams, search, type RawSearchParams } from "@/lib/search";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await getCategory((await params).slug);
  return { title: cat?.name ?? "Not found" };
}

/** F4: category browse reuses the search results view with the category fixed. */
export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const cat = (await getCategory(slug))!; // layout.tsx 404s unknown slugs

  const p = { ...parseSearchParams(await searchParams), cat: slug };
  const result = await search(p);

  const breadcrumb = (
    <nav aria-label="Breadcrumb" className="mb-2 text-xs text-amz-muted">
      <Link href="/" className="hover:text-amz-link-hover hover:underline">
        Home
      </Link>
      {cat.parent && (
        <>
          {" › "}
          <Link href={`/c/${cat.parent.slug}`} className="hover:text-amz-link-hover hover:underline">
            {cat.parent.name}
          </Link>
        </>
      )}
      {" › "}
      <span className="font-bold text-amz-link-hover">{cat.name}</span>
    </nav>
  );

  return <Results result={result} fixedCat={slug} heading={cat.name} breadcrumb={breadcrumb} />;
}
