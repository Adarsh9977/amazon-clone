import Link from "next/link";
import { LockIcon } from "@/components/icons";
import { Logo } from "@/components/Logo";

// Checkout drops the store header for a minimal bar, like the live site.
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="border-b border-[#ddd] bg-gradient-to-b from-white to-[#f3f3f3]">
        <div className="mx-auto flex h-[60px] max-w-[1150px] items-center justify-between px-4">
          <Logo dark />
          <h1 className="flex items-center gap-2 text-xl md:text-[28px]">
            Checkout <LockIcon className="h-5 w-5 text-[#999]" />
          </h1>
          <Link href="/cart" className="text-sm text-amz-link hover:text-amz-link-hover hover:underline">
            Cart
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
