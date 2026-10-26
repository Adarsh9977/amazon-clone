import Link from "next/link";
import { Logo } from "./Logo";

const cols = [
  { title: "Get to Know Us", links: [["About this project", "/"], ["Source on GitHub", "https://github.com/Adarsh9977/amazon-clone"]] },
  { title: "Shop", links: [["Today's Deals", "/s?deals=1"], ["Best Sellers", "/s?sort=best"], ["New Arrivals", "/s?sort=newest"]] },
  { title: "Your Account", links: [["Sign in", "/signin"], ["Your Orders", "/orders"], ["Your Cart", "/cart"]] },
  { title: "Let Us Help You", links: [["Shipping: FREE over $35", "/cart"], ["Test card 4242 4242 4242 4242", "/cart"]] },
] as const;

export function Footer() {
  return (
    <footer className="mt-8 text-white">
      <a href="#top" className="block bg-amz-navy-3 py-4 text-center text-[13px] hover:bg-[#485769]">
        Back to top
      </a>
      <div className="bg-amz-navy-2">
        <div className="mx-auto grid max-w-[1000px] grid-cols-2 gap-8 px-6 py-10 md:grid-cols-4">
          {cols.map((c) => (
            <div key={c.title}>
              <h3 className="mb-2 text-base font-bold">{c.title}</h3>
              <ul className="space-y-1.5 text-sm text-[#ddd]">
                {c.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="hover:underline">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 border-t border-[#3a4553] bg-amz-navy-2 py-6">
        <Logo />
        <p className="px-4 text-center text-xs text-[#ddd]">
          A portfolio rebuild for a take-home assignment. Not affiliated with Amazon. Payments run in Stripe test mode.
        </p>
      </div>
    </footer>
  );
}
