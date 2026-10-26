import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { auth } from "@/lib/auth";
import { checkoutLines, lineProblem, orderTotals } from "@/lib/orders";

export const metadata: Metadata = { title: "Checkout" };

type Props = { searchParams: Promise<{ buyNow?: string; qty?: string }> };

/** F9 (and F13 Buy Now via ?buyNow=&qty=). Middleware guarantees a session. */
export default async function CheckoutPage({ searchParams }: Props) {
  const session = await auth();
  const userId = session!.user.id;
  const sp = await searchParams;
  const buyNowId = Number(sp.buyNow);
  const buyNow =
    Number.isInteger(buyNowId) && buyNowId > 0
      ? { productId: buyNowId, quantity: Math.min(10, Math.max(1, Math.floor(Number(sp.qty) || 1))) }
      : undefined;

  const lines = await checkoutLines(userId, buyNow);
  const problem = lineProblem(lines);
  if (problem && !lines.length) {
    return (
      <div className="mx-auto max-w-[700px] px-4 py-16 text-center">
        <h2 className="text-2xl">Your cart is empty</h2>
        <p className="mt-2 text-sm text-amz-muted">Add something to your cart before checking out.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-amz-yellow px-5 py-2 text-sm shadow-sm hover:bg-amz-yellow-hover">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <CheckoutForm
      lines={lines}
      totals={orderTotals(lines)}
      buyNow={buyNow}
      problem={problem}
      defaultName={session!.user.name ?? ""}
      stripeReady={!!process.env.STRIPE_SECRET_KEY}
    />
  );
}
