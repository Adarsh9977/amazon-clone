"use client";

import { useRouter } from "next/navigation";
import { ChevronIcon } from "../icons";

/** "Sort by: Featured" pill. The server precomputes each option's URL. */
export function SortSelect({ current, options }: { current: string; options: { value: string; label: string; href: string }[] }) {
  const router = useRouter();
  const label = options.find((o) => o.value === current)?.label ?? "Featured";
  return (
    <label className="relative flex h-[29px] shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-amz-border bg-[#f0f2f2] px-2.5 text-xs shadow-[0_2px_5px_rgba(15,17,17,.15)] hover:bg-[#e3e6e6]">
      <span className="text-amz-text">Sort by:</span>
      <span>{label}</span>
      <ChevronIcon className="h-3 w-3" />
      <select
        aria-label="Sort by"
        value={current}
        onChange={(e) => {
          const o = options.find((x) => x.value === e.target.value);
          if (o) router.push(o.href, { scroll: false });
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
