import type { Metadata } from "next";
import { Results } from "@/components/search/Results";
import { getCategory } from "@/lib/catalog";
import { parseSearchParams, search, type RawSearchParams } from "@/lib/search";

type Props = { searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = parseSearchParams(await searchParams);
  return { title: p.k ?? "Search results" };
}

export default async function SearchPage({ searchParams }: Props) {
  const p = parseSearchParams(await searchParams);
  const [result, cat] = await Promise.all([search(p), p.cat ? getCategory(p.cat) : null]);
  const heading = p.deals ? "Today's Deals" : cat?.name;
  return <Results result={result} heading={heading} />;
}
