import { notFound } from "next/navigation";
import { getProduct } from "@/lib/product";

// Outside loading.tsx's Suspense boundary so an unknown slug is a real 404 (see app/c/[slug]/layout.tsx).
export default async function ProductLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  if (!(await getProduct((await params).slug))) notFound();
  return children;
}
