"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Package,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { getProduct } from "@/lib/api/products";
import { addCartItem } from "@/lib/api/cart";
import { DEMO_CART_ID } from "@/lib/config";
import { formatINR } from "@/lib/utils";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import type { Product } from "@/types";

export default function ProductDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = Number(params.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    getProduct(id)
      .then(setProduct)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load product details."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAddToCart(goToCart = false) {
    if (!product) return;
    setBusy(true);
    setError(null);
    setAdded(false);
    try {
      await addCartItem(DEMO_CART_ID, product.id, 1);
      setAdded(true);
      if (goToCart) {
        router.push("/cart");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add item to cart.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading label="Loading product..." />;
  if (error && !product) return <Alert message={error} />;
  if (!product) return null;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/products"
        className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={14} strokeWidth={2.5} /> ← Back to Catalog
      </Link>

      <div className="grid gap-0 border-2 border-ink bg-card shadow-brutal md:grid-cols-2">
        {/* Product image */}
        <div className="flex min-h-72 items-center justify-center border-b-2 border-ink bg-canvas text-muted md:border-b-0 md:border-r-2 md:border-ink">
          <div className="text-center space-y-3">
            <Package size={80} strokeWidth={1} className="mx-auto text-muted/40" />
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted">
              Verified Catalog Item
            </p>
          </div>
        </div>

        {/* Product info */}
        <div className="flex flex-col justify-between p-6 sm:p-8">
          <div>
            {/* Status tags */}
            <div className="flex items-center gap-2">
              <span className="border-2 border-success bg-success px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
                In Stock
              </span>
              <span className="font-mono text-[10px] font-bold text-muted">
                SKU #{product.id}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="font-mono mt-3 text-3xl font-bold text-accent">
              {formatINR(product.price)}
            </p>
            <p className="font-mono mt-1 text-[10px] text-muted">
              Includes all applicable taxes &amp; free shipping
            </p>

            {/* Perks */}
            <div className="mt-6 space-y-3 border-y-2 border-ink py-5 text-sm">
              <div className="flex items-center gap-3 text-muted">
                <Truck size={15} className="shrink-0 text-accent" strokeWidth={2} />
                <span>Express 2-3 Day Delivery across India</span>
              </div>
              <div className="flex items-center gap-3 text-muted">
                <RotateCcw size={15} className="shrink-0 text-accent" strokeWidth={2} />
                <span>7-Day Return &amp; Replacement Guarantee</span>
              </div>
              <div className="flex items-center gap-3 text-muted">
                <ShieldCheck size={15} className="shrink-0 text-success" strokeWidth={2} />
                <span>100% Genuine and Quality Inspected</span>
              </div>
            </div>
          </div>

          {/* Action area */}
          <div className="mt-6 space-y-3">
            {error && <Alert message={error} />}
            {added && (
              <div className="flex items-center gap-2 border-2 border-success bg-card p-3 text-sm">
                <Check size={14} className="text-success" strokeWidth={3} />
                <span className="font-bold text-success">Added to your cart!</span>
                <Link
                  href="/cart"
                  className="font-mono ml-auto text-[10px] font-bold uppercase tracking-widest text-ink underline"
                >
                  View Cart
                </Link>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                id="add-to-cart-btn"
                onClick={() => void handleAddToCart(false)}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-ink bg-ink px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-brutal-sm transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:transform-none"
              >
                <ShoppingCart size={15} strokeWidth={2.5} />
                {busy ? "Adding..." : "Add to Cart"}
              </button>
              <button
                id="buy-now-btn"
                onClick={() => void handleAddToCart(true)}
                disabled={busy}
                className="border-2 border-ink bg-card px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-ink shadow-brutal-sm transition-all hover:bg-ink hover:text-white hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:transform-none"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
