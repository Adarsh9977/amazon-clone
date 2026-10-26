"use client";

import { useCart } from "@/store/cart";
import { useToast } from "@/store/toast";

export type CartableProduct = {
  id: number;
  slug: string;
  title: string;
  thumbnail: string;
  priceCents: number;
  stock: number;
};

export function useAddToCart() {
  const add = useCart((s) => s.add);
  const show = useToast((s) => s.show);
  return (p: CartableProduct, quantity = 1) => {
    add({ productId: p.id, slug: p.slug, title: p.title, image: p.thumbnail, priceCents: p.priceCents, stock: p.stock }, quantity);
    show({ title: "Added to cart", image: p.thumbnail, detail: quantity > 1 ? `${quantity} × ${p.title}` : p.title });
  };
}

/** Small rounded yellow button used on result cards. */
export function AddToCartButton({ product }: { product: CartableProduct }) {
  const addToCart = useAddToCart();
  if (product.stock <= 0) return <p className="text-sm text-amz-price">Currently unavailable.</p>;
  return (
    <button
      type="button"
      onClick={() => addToCart(product)}
      className="h-8 rounded-full bg-amz-yellow px-3 text-[13px] text-amz-text shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-amz-yellow-hover active:shadow-none"
    >
      Add to cart
    </button>
  );
}
