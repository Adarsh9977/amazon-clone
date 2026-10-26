"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Custom min/max. The server passes a URL template with __MIN__/__MAX__ so filters stay in one place. */
export function PriceRangeForm({ min, max, hrefTemplate }: { min?: number; max?: number; hrefTemplate: string }) {
  const router = useRouter();
  const [lo, setLo] = useState(min?.toString() ?? "");
  const [hi, setHi] = useState(max?.toString() ?? "");

  return (
    <form
      className="mt-2 flex items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        let [a, b] = [parseFloat(lo), parseFloat(hi)];
        if (a > b) [a, b] = [b, a];
        // Empty side → drop that param from the URL.
        const url = hrefTemplate
          .replace(/([?&])min=__MIN__&?/, isNaN(a) ? "$1" : `$1min=${a}&`)
          .replace(/([?&])max=__MAX__&?/, isNaN(b) ? "$1" : `$1max=${b}&`)
          .replace(/[?&]$/, "");
        router.push(url, { scroll: false });
      }}
    >
      <input
        inputMode="decimal"
        aria-label="Minimum price"
        placeholder="$ Min"
        value={lo}
        onChange={(e) => setLo(e.target.value.replace(/[^\d.]/g, ""))}
        className="h-[30px] w-[68px] rounded-md border border-[#888c8c] px-2 text-[13px] shadow-[inset_0_1px_2px_rgba(15,17,17,.15)] outline-none focus:border-amz-link focus:ring-2 focus:ring-[#c8f3fa]"
      />
      <input
        inputMode="decimal"
        aria-label="Maximum price"
        placeholder="$ Max"
        value={hi}
        onChange={(e) => setHi(e.target.value.replace(/[^\d.]/g, ""))}
        className="h-[30px] w-[68px] rounded-md border border-[#888c8c] px-2 text-[13px] shadow-[inset_0_1px_2px_rgba(15,17,17,.15)] outline-none focus:border-amz-link focus:ring-2 focus:ring-[#c8f3fa]"
      />
      <button type="submit" className="h-[30px] rounded-md border border-amz-border bg-white px-2.5 text-[13px] shadow-sm hover:bg-[#f7fafa]">
        Go
      </button>
    </form>
  );
}
