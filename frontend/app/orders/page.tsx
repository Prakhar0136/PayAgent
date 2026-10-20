"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, PackageCheck } from "lucide-react";
import { getUserOrders } from "@/lib/api/orders";
import { DEMO_USER_ID } from "@/lib/config";
import { formatINR } from "@/lib/utils";
import type { Order } from "@/types";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getUserOrders(DEMO_USER_ID)
      .then(setOrders)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load order history."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-2 border-ink pb-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
          // Purchase History
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">My Orders</h1>
        <p className="mt-1 text-sm text-muted">
          Track and review your past purchases and delivery statuses.
        </p>
      </div>

      {loading && <Loading label="Loading your order history..." />}
      {error && <Alert message={error} />}

      {!loading && !error && orders.length === 0 && (
        <div className="border-2 border-dashed border-ink bg-card p-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-ink bg-canvas text-muted">
            <PackageCheck size={28} strokeWidth={1.5} />
          </div>
          <h2 className="mt-5 text-xl font-bold uppercase tracking-wide">
            No Orders Placed Yet
          </h2>
          <p className="mt-2 mx-auto max-w-sm text-sm text-muted">
            Once you complete a purchase through our AI assistant or catalog, your receipts will appear here.
          </p>
          <Link
            href="/"
            className="mt-7 inline-flex items-center gap-2 border-2 border-ink bg-ink px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-brutal-sm transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            Start Shopping
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {orders.map((order) => {
          const total = order.items.reduce(
            (sum, item) => sum + item.unit_price * item.quantity,
            0
          );
          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="group flex flex-col justify-between gap-4 border-2 border-ink bg-card p-5 shadow-brutal-sm transition-all hover:shadow-brutal hover:bg-canvas sm:flex-row sm:items-center"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <p className="font-bold">Order #{order.id}</p>
                  <StatusBadge status={order.status} />
                </div>
                <p className="font-mono mt-1 text-xs text-muted">
                  {order.items.length} line item{order.items.length === 1 ? "" : "s"} · Express
                  Delivery
                </p>
              </div>
              <div className="flex items-center justify-between gap-5 sm:justify-end">
                <p className="font-mono text-base font-bold">{formatINR(total)}</p>
                <div className="flex h-8 w-8 items-center justify-center border-2 border-ink bg-canvas text-ink transition-all group-hover:bg-ink group-hover:text-white">
                  <ArrowUpRight size={16} strokeWidth={2.5} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
