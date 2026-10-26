import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Shopping Cart" };

export default function CartPage() {
  return (
    <div className="min-h-[60vh] bg-amz-bg">
      <CartView />
    </div>
  );
}
