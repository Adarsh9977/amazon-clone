"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto max-w-[700px] px-4 py-16 text-center">
      <h1 className="text-[28px] leading-9">Sorry, something went wrong on our end</h1>
      <p className="mt-2 text-sm text-amz-muted">Please try again. If it keeps happening, head back to the home page.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={reset} className="rounded-full bg-amz-yellow px-5 py-2 text-sm shadow-sm hover:bg-amz-yellow-hover">
          Try again
        </button>
        <Link href="/" className="rounded-full border border-amz-border bg-white px-5 py-2 text-sm shadow-sm hover:bg-[#f7fafa]">
          Home
        </Link>
      </div>
    </div>
  );
}
