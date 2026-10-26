import Link from "next/link";

/** Text wordmark with a drawn smile. Never Amazon's logo asset (CLAUDE.md: branding). */
export function Logo({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Home"
      className={`relative inline-flex flex-col items-start rounded-sm border border-transparent px-1.5 pb-2 pt-1 hover:border-current ${className}`}
    >
      <span
        className={`text-[26px] font-bold leading-none tracking-[-0.04em] ${dark ? "text-amz-text" : "text-white"}`}
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        amazon
        <span className={`ml-0.5 text-[13px] font-normal tracking-normal ${dark ? "text-amz-text" : "text-white"}`}>.clone</span>
      </span>
      <svg viewBox="0 0 100 14" className="absolute bottom-0.5 left-2 h-[10px] w-[68px]" aria-hidden>
        <path d="M3 3 Q 48 15 88 4" fill="none" stroke="#ff9900" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M82 1.5 L90 3.6 L85.5 10" fill="none" stroke="#ff9900" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
