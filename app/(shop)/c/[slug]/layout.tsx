import { notFound } from "next/navigation";
import { getCategory } from "@/lib/catalog";

// The slug check lives here, outside loading.tsx's Suspense boundary, so an unknown
// category returns a real 404 status instead of a streamed 200 with not-found content.
export default async function CategoryLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  if (!(await getCategory((await params).slug))) notFound();
  return children;
}
