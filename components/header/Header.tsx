import Link from "next/link";
import { Suspense } from "react";
import { getDepartments } from "@/lib/catalog";
import { Logo } from "../Logo";
import { ChevronIcon, MenuIcon, PinIcon, UserIcon } from "../icons";
import { CartLink } from "./CartLink";
import { SearchBar } from "./SearchBar";

const box = "rounded-sm border border-transparent hover:border-white";

export async function Header() {
  const departments = await getDepartments();
  const depts = departments.map((d) => ({ slug: d.slug, name: d.name }));

  // F1: navy bar + sub-nav. Under 768px the search drops to its own row.
  return (
    <header className="sticky top-0 z-40 text-white">
      <div className="bg-amz-navy">
        <div className="flex h-[60px] items-center gap-1 px-2 md:gap-2 md:px-3">
          <Logo />
          <Link href="/" className={`${box} hidden shrink-0 items-end gap-0.5 px-1.5 py-1 lg:flex`}>
            <PinIcon className="mb-0.5 h-[18px] w-[18px]" />
            <span className="flex flex-col">
              <span className="text-xs leading-[14px] text-[#ccc]">Deliver to</span>
              <span className="text-sm font-bold leading-[15px]">New York 10001</span>
            </span>
          </Link>
          <div className="mx-2 hidden min-w-0 flex-1 md:flex">
            <Suspense fallback={<div className="h-10 w-full rounded-md bg-white" />}>
              <SearchBar departments={depts} />
            </Suspense>
          </div>
          <div className="ml-auto flex items-center md:ml-0">
            <Link href="/signin" className={`${box} flex flex-col px-1.5 py-1.5`}>
              <span className="flex items-center gap-1 text-xs leading-[14px]">
                <span className="hidden sm:inline">Hello, sign in</span>
                <span className="sm:hidden">Sign in</span>
                <UserIcon className="h-5 w-5 sm:hidden" />
              </span>
              <span className="hidden items-center gap-0.5 text-sm font-bold leading-[15px] sm:flex">
                Account &amp; Lists <ChevronIcon className="h-3 w-3 text-[#a7acb2]" />
              </span>
            </Link>
            <Link href="/orders" className={`${box} hidden flex-col px-1.5 py-1.5 sm:flex`}>
              <span className="text-xs leading-[14px]">Returns</span>
              <span className="text-sm font-bold leading-[15px]">&amp; Orders</span>
            </Link>
            <CartLink />
          </div>
        </div>
        <div className="px-2.5 pb-2.5 md:hidden">
          <Suspense fallback={<div className="h-10 w-full rounded-md bg-white" />}>
            <SearchBar departments={depts} />
          </Suspense>
        </div>
      </div>

      <nav aria-label="Departments" className="bg-amz-navy-2">
        <ul className="no-scrollbar flex h-[39px] items-center gap-0.5 overflow-x-auto px-2 text-sm whitespace-nowrap">
          <li>
            <Link href="/s" className={`${box} flex items-center gap-1 px-2 py-1 font-bold`}>
              <MenuIcon className="h-5 w-5" /> All
            </Link>
          </li>
          <li>
            <Link href="/s?deals=1" className={`${box} block px-2 py-1`}>
              Today&apos;s Deals
            </Link>
          </li>
          {departments.map((d) => (
            <li key={d.slug}>
              <Link href={`/c/${d.slug}`} className={`${box} block px-2 py-1`}>
                {d.name}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/s?sort=best" className={`${box} block px-2 py-1`}>
              Best Sellers
            </Link>
          </li>
          <li>
            <Link href="/s?sort=newest" className={`${box} block px-2 py-1`}>
              New Arrivals
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
