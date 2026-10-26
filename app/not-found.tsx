import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[700px] flex-col items-center px-4 py-16 text-center">
      {/* Original illustration: an empty box, our homage to the live site's 404 dog. */}
      <svg viewBox="0 0 200 140" className="mb-6 h-36 w-52" aria-hidden>
        <path d="M30 60 L100 35 L170 60 L170 120 L100 135 L30 120 Z" fill="#f3d9a4" stroke="#b58a3c" strokeWidth="2" />
        <path d="M30 60 L100 85 L170 60" fill="none" stroke="#b58a3c" strokeWidth="2" />
        <path d="M100 85 L100 135" stroke="#b58a3c" strokeWidth="2" />
        <path d="M30 60 L10 40 L80 18 L100 35" fill="#e9c47f" stroke="#b58a3c" strokeWidth="2" />
        <path d="M170 60 L190 40 L120 18 L100 35" fill="#e9c47f" stroke="#b58a3c" strokeWidth="2" />
        <path d="M60 100 Q 70 110 80 100" fill="none" stroke="#ff9900" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <h1 className="text-[28px] font-normal leading-9">Sorry, we couldn&apos;t find that page</h1>
      <p className="mt-2 text-sm text-amz-muted">The link may be broken, or the item may no longer be listed.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="rounded-full bg-amz-yellow px-5 py-2 text-sm shadow-sm hover:bg-amz-yellow-hover">
          Go to the home page
        </Link>
        <Link href="/s?deals=1" className="rounded-full border border-amz-border bg-white px-5 py-2 text-sm shadow-sm hover:bg-[#f7fafa]">
          Shop today&apos;s deals
        </Link>
      </div>
    </div>
  );
}
