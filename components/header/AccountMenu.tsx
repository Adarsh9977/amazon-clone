"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { ChevronIcon, UserIcon } from "../icons";

const box = "rounded-sm border border-transparent hover:border-white";

/** "Hello, sign in / Account & Lists" with a hover menu; "Hello, Name" when signed in (F7). */
export function AccountMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const first = session?.user?.name?.split(" ")[0];
  const greeting = status === "authenticated" ? `Hello, ${first}` : "Hello, sign in";

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Link
        href={status === "authenticated" ? "/orders" : "/signin"}
        className={`${box} flex flex-col px-1.5 py-1.5`}
        onFocus={() => setOpen(true)}
      >
        <span className="flex items-center gap-1 text-xs leading-[14px]">
          <span className="hidden sm:inline">{greeting}</span>
          <span className="max-w-[80px] truncate sm:hidden">{status === "authenticated" ? first : "Sign in"}</span>
          <UserIcon className="h-5 w-5 sm:hidden" />
        </span>
        <span className="hidden items-center gap-0.5 text-sm font-bold leading-[15px] sm:flex">
          Account &amp; Lists <ChevronIcon className="h-3 w-3 text-[#a7acb2]" />
        </span>
      </Link>

      {open && (
        <div className="absolute right-0 top-full z-50 w-[260px] rounded-sm bg-white p-4 text-amz-text shadow-[0_2px_8px_rgba(0,0,0,.35)]">
          {status === "authenticated" ? (
            <>
              <p className="mb-2 text-xs text-amz-muted">Signed in as {session.user?.email}</p>
              <ul className="space-y-1.5 text-[13px]">
                <li>
                  <Link href="/orders" className="hover:text-amz-link-hover hover:underline">
                    Your Orders
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className="hover:text-amz-link-hover hover:underline">
                    Your Cart
                  </Link>
                </li>
                <li>
                  <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="hover:text-amz-link-hover hover:underline">
                    Sign Out
                  </button>
                </li>
              </ul>
            </>
          ) : (
            <div className="text-center">
              <Link
                href="/signin"
                className="block rounded-full bg-amz-yellow py-1.5 text-[13px] shadow-sm hover:bg-amz-yellow-hover"
              >
                Sign in
              </Link>
              <p className="mt-2 text-[11px]">
                New customer?{" "}
                <Link href="/register" className="text-amz-link hover:text-amz-link-hover hover:underline">
                  Start here.
                </Link>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
