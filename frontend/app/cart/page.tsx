"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Lock, RotateCcw, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { getCart, removeCartItem, updateCartItem } from "@/lib/api/cart";
import { getProducts } from "@/lib/api/products";
import { DEMO_CART_ID } from "@/lib/config";
import { formatINR } from "@/lib/utils";
import type { Cart, Product } from "@/types";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyItem, setBusyItem] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [cartData, productData] = await Promise.all([
      getCart(DEMO_CART_ID),
      getProducts(),
    ]);
    setCart(cartData);
    setProducts(productData);
  }, []);

  useEffect(() => {
    refresh()
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load cart items."))
      .finally(() => setLoading(false));
  }, [refresh]);

  const productById = new Map(products.map((p) => [p.id, p]));
  const total =
    cart?.items.reduce((sum, item) => {
      const product = productById.get(item.product_id);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0) ?? 0;
  const allPricesKnown = Boolean(
    cart?.items.every((item) => productById.has(item.product_id))
  );

  async function changeQuantity(itemId: number, quantity: number) {
    setBusyItem(itemId);
    setError(null);
    try {
      await updateCartItem(DEMO_CART_ID, itemId, quantity);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update item quantity.");
    } finally {
      setBusyItem(null);
    }
  }

  async function remove(itemId: number) {
    setBusyItem(itemId);
    setError(null);
    try {
      await removeCartItem(DEMO_CART_ID, itemId);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove item from cart.");
    } finally {
      setBusyItem(null);
    }
  }

  if (loading) return <Loading label="Loading your cart..." />;

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-2 border-ink pb-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
              // Shopping Cart
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Shopping Cart
            </h1>
            <p className="mt-1 text-sm text-muted">
              {itemCount > 0
                ? `${itemCount} item${itemCount === 1 ? "" : "s"} ready for checkout`
                : "Your cart is empty"}
            </p>
          </div>
          {itemCount > 0 && (
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-widest text-muted hover:text-ink transition-colors"
            >
              Continue Shopping <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </div>

      {error && <Alert message={error} />}

      {!cart || cart.items.length === 0 ? (
        /* Empty state */
        <div className="border-2 border-dashed border-ink bg-card p-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-ink bg-canvas text-muted">
            <ShoppingCart size={28} strokeWidth={1.5} />
          </div>
          <h2 className="mt-5 text-xl font-bold uppercase tracking-wide">Your Cart Is Empty</h2>
          <p className="mt-2 mx-auto max-w-xs text-sm text-muted">
            Ask our AI assistant to find products tailored to your budget or explore our catalog.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 border-2 border-ink bg-ink px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-brutal-sm transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              Ask AI Assistant <ArrowRight size={15} />
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 border-2 border-ink bg-card px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-ink shadow-brutal-sm transition-all hover:bg-ink hover:text-white hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Cart items */}
          <div className="space-y-3">
            {cart.items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                product={productById.get(item.product_id)}
                busy={busyItem === item.id}
                onQuantity={(quantity) => void changeQuantity(item.id, quantity)}
                onRemove={() => void remove(item.id)}
              />
            ))}
          </div>

          {/* Order summary */}
          <aside className="h-fit border-2 border-ink bg-card shadow-brutal">
            <div className="border-b-2 border-ink bg-ink px-5 py-3">
              <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-white">
                Order Summary
              </h2>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Total Items</span>
                  <span className="font-mono font-bold text-ink">{itemCount}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Shipping</span>
                  <span className="font-mono font-bold text-success">FREE</span>
                </div>
                <div className="border-t-2 border-ink pt-3 flex justify-between">
                  <span className="font-bold uppercase tracking-wide">Subtotal</span>
                  <span className="font-mono text-base font-bold text-accent">
                    {allPricesKnown ? formatINR(total) : "Unavailable"}
                  </span>
                </div>
              </div>

              <Link
                href="/checkout"
                className={`flex items-center justify-center gap-2 border-2 border-ink px-4 py-3 text-sm font-bold uppercase tracking-wider shadow-brutal-sm transition-all ${
                  allPricesKnown
                    ? "bg-ink text-white hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                    : "pointer-events-none bg-muted/20 text-muted"
                }`}
              >
                <Lock size={14} strokeWidth={2.5} />
                Proceed to Checkout
                <ArrowRight size={14} />
              </Link>

              <div className="border-t border-ink/20 pt-4 space-y-2.5 text-xs text-muted">
                <div className="flex items-center gap-2">
                  <Truck size={13} className="shrink-0 text-accent" strokeWidth={2} />
                  <span>Free Express Shipping across India</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw size={13} className="shrink-0 text-accent" strokeWidth={2} />
                  <span>7-Day Return &amp; Replacement Policy</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={13} className="shrink-0 text-success" strokeWidth={2} />
                  <span>100% Genuine and Verified Products</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
