"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SearchIcon, ChevronIcon } from "../icons";

type Dept = { slug: string; name: string };
type Suggestion = { title: string; slug: string };

export function SearchBar({ departments }: { departments: Dept[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  // On a category page the select defaults to that category, like the live site.
  const pathCat = pathname.startsWith("/c/") ? pathname.slice(3) : "";
  const [q, setQ] = useState(sp.get("k") ?? "");
  const [cat, setCat] = useState(sp.get("cat") ?? (departments.some((d) => d.slug === pathCat) ? pathCat : ""));
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setQ(sp.get("k") ?? "");
  }, [sp]);

  // F15: debounced suggestions after 2 characters. The abort guard stops stale responses winning.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (res.ok) setItems((await res.json()).items);
      } catch {
        /* aborted or offline: keep the old list */
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function submit(term: string) {
    setOpen(false);
    const params = new URLSearchParams();
    if (term.trim()) params.set("k", term.trim());
    if (cat) params.set("cat", cat);
    router.push(`/s${params.size ? `?${params}` : ""}`);
  }

  const selectedName = departments.find((d) => d.slug === cat)?.name ?? "All";

  return (
    <form
      ref={boxRef}
      role="search"
      className="relative flex h-10 w-full min-w-0 rounded-md focus-within:ring-[3px] focus-within:ring-amz-orange"
      onSubmit={(e) => {
        e.preventDefault();
        if (active >= 0 && items[active]) {
          setOpen(false);
          router.push(`/dp/${items[active].slug}`);
        } else submit(q);
      }}
    >
      <label className="relative hidden shrink-0 cursor-pointer items-center gap-1 rounded-l-md border-r border-[#cdcdcd] bg-[#e6e6e6] pl-2.5 pr-2 text-xs text-[#555] hover:bg-[#d4d4d4] hover:text-black sm:flex">
        <span className="max-w-[140px] truncate">{selectedName}</span>
        <ChevronIcon className="h-3 w-3" />
        <select
          aria-label="Search in"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      <input
        type="text"
        name="k"
        value={q}
        autoComplete="off"
        spellCheck={false}
        aria-label="Search Amazon clone"
        placeholder="Search Amazon.clone"
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          else if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(a + 1, items.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, -1));
          }
        }}
        className="min-w-0 flex-1 rounded-l-md bg-white px-2.5 text-[15px] text-amz-text outline-none placeholder:text-[#757575] sm:rounded-none"
      />
      <button
        type="submit"
        aria-label="Go"
        className="flex w-11 shrink-0 items-center justify-center rounded-r-md bg-amz-search text-amz-navy hover:bg-amz-search-hover"
      >
        <SearchIcon className="h-5 w-5" />
      </button>

      {open && items.length > 0 && q.trim().length >= 2 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-0.5 overflow-hidden rounded-b-md border border-[#cdcdcd] bg-white py-1 text-[15px] text-amz-text shadow-lg"
        >
          {items.map((s, i) => (
            <li key={s.slug} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  setOpen(false);
                  router.push(`/dp/${s.slug}`);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left ${i === active ? "bg-[#eee]" : ""}`}
              >
                <SearchIcon className="h-3.5 w-3.5 shrink-0 text-[#999]" />
                <span className="truncate">{s.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
