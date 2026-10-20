"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Lock,
  Package,
  RotateCcw,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import { getCart, checkoutCart } from "@/lib/api/cart";
import { getProducts } from "@/lib/api/products";
import { DEMO_CART_ID } from "@/lib/config";
import { formatINR } from "@/lib/utils";
import type { Cart, Product } from "@/types";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");

  useEffect(() => {
    Promise.all([getCart(DEMO_CART_ID), getProducts()])
      .then(([cartData, productData]) => {
        setCart(cartData);
        setProducts(productData);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Could not load checkout details.")
      )
      .finally(() => setLoading(false));
  }, []);

  const productById = new Map(products.map((p) => [p.id, p]));
  const total =
    cart?.items.reduce(
      (sum, item) =>
        sum + (productById.get(item.product_id)?.price ?? 0) * item.quantity,
      0
    ) ?? 0;
  const pricesKnown = Boolean(
    cart?.items.length && cart.items.every((item) => productById.has(item.product_id))
  );

  async function placeOrder() {
    setBusy(true);
    setError(null);
    try {
      const key =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `order-${Date.now()}`;
      const order = await checkoutCart(DEMO_CART_ID, key);
      router.push(`/orders/${order.id}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Checkout transaction failed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading label="Securing checkout session..." />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back */}
      <Link
        href="/cart"
        className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={14} strokeWidth={2.5} /> ← Return to Cart
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b-2 border-ink pb-5">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
            // Secure Checkout
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Secure Checkout</h1>
          <p className="mt-1 text-sm text-muted">Review your order details and complete payment.</p>
        </div>
        <div className="flex items-center gap-2 border-2 border-success bg-card px-3 py-2 text-xs font-bold uppercase tracking-widest text-success shadow-brutal-sm">
          <Lock size={12} strokeWidth={2.5} />
          <span className="font-mono">256-Bit SSL</span>
        </div>
      </div>

      {error && <Alert message={error} />}

      {!cart || cart.items.length === 0 ? (
        <div className="border-2 border-ink bg-card p-10 text-center shadow-brutal">
          <p className="text-lg font-bold">Your cart is currently empty.</p>
          <p className="mt-1 text-sm text-muted">
            Add products from our catalog or via our AI assistant to proceed.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 border-2 border-ink bg-ink px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-brutal-sm transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          {/* Left column */}
          <div className="space-y-5">
            {/* Delivery address */}
            <div className="border-2 border-ink bg-card shadow-brutal-sm">
              <div className="flex items-center gap-2 border-b-2 border-ink bg-ink px-5 py-3 text-white">
                <Truck size={14} strokeWidth={2.5} />
                <span className="font-mono text-xs font-bold uppercase tracking-widest">
                  Delivery Address
                </span>
                <span className="ml-auto font-mono text-[10px] font-bold text-white/60 uppercase tracking-widest">
                  Default
                </span>
              </div>
              <div className="p-5 text-sm">
                <p className="font-bold">Registered Customer</p>
                <p className="mt-1 text-muted">
                  Primary Shipping Destination, Express Cargo Lane
                </p>
                <p className="mt-3 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-success">
                  <Check size={12} strokeWidth={3} />
                  Guaranteed Express Delivery (2-3 Business Days)
                </p>
              </div>
            </div>

            {/* Payment method */}
            <div className="border-2 border-ink bg-card shadow-brutal-sm">
              <div className="flex items-center gap-2 border-b-2 border-ink bg-ink px-5 py-3 text-white">
                <CreditCard size={14} strokeWidth={2.5} />
                <span className="font-mono text-xs font-bold uppercase tracking-widest">
                  Payment Method
                </span>
              </div>
              <div className="p-5 space-y-3">
                {(
                  [
                    {
                      id: "upi",
                      icon: <Wallet size={16} strokeWidth={2} />,
                      label: "UPI / Instant Pay",
                      sub: "Google Pay, PhonePe, Paytm, BHIM",
                    },
                    {
                      id: "card",
                      icon: <CreditCard size={16} strokeWidth={2} />,
                      label: "Credit / Debit Card",
                      sub: "Visa, Mastercard, RuPay, Amex",
                    },
                  ] as const
                ).map(({ id, icon, label, sub }) => (
                  <label
                    key={id}
                    onClick={() => setPaymentMethod(id)}
                    className={`flex cursor-pointer items-center justify-between border-2 p-4 transition-all ${
                      paymentMethod === id
                        ? "border-accent bg-accent/5"
                        : "border-ink/30 bg-canvas hover:border-ink"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={paymentMethod === id ? "text-accent" : "text-muted"}
                      >
                        {icon}
                      </span>
                      <div>
                        <p className="text-sm font-bold">{label}</p>
                        <p className="font-mono text-[10px] text-muted">{sub}</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === id}
                      onChange={() => setPaymentMethod(id)}
                      className="accent-accent"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: Order summary */}
          <div className="h-fit border-2 border-ink bg-card shadow-brutal">
            <div className="border-b-2 border-ink bg-ink px-5 py-3">
              <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-white">
                Order Summary
              </h2>
            </div>

            <div className="p-5 space-y-4">
              {/* Items */}
              <div className="divide-y divide-ink/10 max-h-56 overflow-y-auto">
                {cart.items.map((item) => {
                  const product = productById.get(item.product_id);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2.5 text-sm"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold truncate">
                          {product?.name || `Product #${item.product_id}`}
                        </p>
                        <p className="font-mono text-[10px] text-muted">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-mono font-bold shrink-0">
                        {product ? formatINR(product.price * item.quantity) : "—"}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="border-t-2 border-ink pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-ink">
                    {pricesKnown ? formatINR(total) : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Shipping</span>
                  <span className="font-mono font-bold text-success">FREE</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-ink/20">
                  <span className="font-bold uppercase tracking-wide">Total</span>
                  <span className="font-mono text-base font-bold text-accent">
                    {pricesKnown ? formatINR(total) : "—"}
                  </span>
                </div>
              </div>

              {/* Place order button */}
              <button
                id="place-order-btn"
                onClick={() => void placeOrder()}
                disabled={busy || !pricesKnown}
                className="w-full border-2 border-ink bg-ink py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-brutal-sm transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none disabled:shadow-brutal-sm"
              >
                {busy
                  ? "Authorizing Payment..."
                  : `Pay ${pricesKnown ? formatINR(total) : ""} & Place Order`}
              </button>

              <div className="flex items-center justify-center gap-1.5 pt-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                <ShieldCheck size={12} className="text-success" strokeWidth={2} />
                <span>100% Purchase Protection Guarantee</span>
              </div>

              {/* Trust badges */}
              <div className="border-t border-ink/10 pt-4 space-y-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                <div className="flex items-center gap-2">
                  <Package size={12} className="shrink-0" strokeWidth={2} />
                  Free Express Shipping
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw size={12} className="shrink-0" strokeWidth={2} />
                  7-Day Return Policy
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
