"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Clock, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { getOrder } from "@/lib/api/orders";
import { getProducts } from "@/lib/api/products";
import { formatINR } from "@/lib/utils";
import type { Order, Product } from "@/types";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getOrder(id), getProducts()])
      .then(([orderData, productData]) => {
        setOrder(orderData);
        setProducts(productData);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load order receipt."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading label="Retrieving order receipt..." />;
  if (error) return <Alert message={error} />;
  if (!order) return null;

  const productById = new Map(products.map((p) => [p.id, p]));
  const total = order.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  const steps = [
    { icon: Check, label: "Order Placed", done: true },
    { icon: Clock, label: "Processing", done: false, active: true },
    { icon: Truck, label: "Express Delivery", done: false },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={14} strokeWidth={2.5} /> ← All Orders
      </Link>

      {/* Order header */}
      <div className="border-2 border-ink bg-card shadow-brutal">
        <div className="border-b-2 border-ink bg-ink px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <PackageCheck size={15} strokeWidth={2.5} />
            <h1 className="font-mono text-sm font-bold uppercase tracking-widest">
              Order #{order.id}
            </h1>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="p-5">
          <p className="font-mono text-[10px] text-muted uppercase tracking-widest">
            Customer #{order.user_id} · Payment Authorized
          </p>

          {/* Progress tracker */}
          <div className="mt-5 grid grid-cols-3 border-t-2 border-ink pt-5">
            {steps.map(({ icon: Icon, label, done, active }, i) => (
              <div
                key={label}
                className={`flex flex-col items-center gap-2 text-center ${
                  i < steps.length - 1 ? "border-r border-ink/20" : ""
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center border-2 ${
                    done
                      ? "border-success bg-success text-white"
                      : active
                      ? "border-accent text-accent animate-pulse"
                      : "border-muted/30 text-muted/30"
                  }`}
                >
                  <Icon size={14} strokeWidth={2.5} />
                </span>
                <span
                  className={`font-mono text-[10px] font-bold uppercase tracking-widest ${
                    done ? "text-success" : active ? "text-accent" : "text-muted/50"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="border-2 border-ink bg-card shadow-brutal">
        <div className="border-b-2 border-ink bg-ink px-5 py-3">
          <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-white">
            Items Ordered
          </h2>
        </div>

        <div className="divide-y divide-ink/10">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 px-5 py-4 text-sm">
              <div>
                <p className="font-bold">
                  {productById.get(item.product_id)?.name || `Product #${item.product_id}`}
                </p>
                <p className="font-mono mt-0.5 text-[10px] uppercase tracking-widest text-muted">
                  {formatINR(item.unit_price)} × {item.quantity}
                </p>
              </div>
              <p className="font-mono font-bold shrink-0">
                {formatINR(item.unit_price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t-2 border-ink px-5 py-4 space-y-2 text-sm">
          <div className="flex justify-between text-muted">
            <span>Shipping</span>
            <span className="font-mono font-bold text-success">FREE Express</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Payment</span>
            <span className="font-mono font-bold text-ink">Verified &amp; Authorized</span>
          </div>
          <div className="flex justify-between border-t-2 border-ink pt-3 text-base font-bold">
            <span className="uppercase tracking-wide">Total Paid</span>
            <span className="font-mono text-accent">{formatINR(total)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-ink/10 px-5 py-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted">
          <ShieldCheck size={12} className="text-success" strokeWidth={2} />
          Official purchase receipt &amp; delivery guarantee
        </div>
      </div>
    </div>
  );
}
