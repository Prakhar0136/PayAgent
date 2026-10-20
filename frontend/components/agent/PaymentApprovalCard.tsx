"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ShieldAlert, ShoppingBag, X, ArrowRight, Loader2 } from "lucide-react";
import { approveAgentPayment, rejectAgentPayment } from "@/lib/api/agent";
import { formatINR } from "@/lib/utils";
import type { AgentFinalResponse } from "@/types";

interface PaymentApprovalCardProps {
  threadId: string;
  cartTotal?: number;
  itemsAdded?: unknown[];
  message?: string;
  onResolved: (result: AgentFinalResponse) => void;
}

export function PaymentApprovalCard({
  threadId,
  cartTotal = 0,
  itemsAdded = [],
  message,
  onResolved,
}: PaymentApprovalCardProps) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setLoading("approve");
    setError(null);
    try {
      const response = await approveAgentPayment(threadId);
      onResolved(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment approval failed. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleReject() {
    setLoading("reject");
    setError(null);
    try {
      const response = await rejectAgentPayment(threadId, "Payment declined by user in review.");
      onResolved(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment cancellation failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="border-2 border-warn bg-card shadow-brutal">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-warn bg-warn px-5 py-3">
        <div className="flex items-center gap-2 text-white">
          <ShieldAlert size={16} strokeWidth={2.5} />
          <span className="font-mono text-xs font-bold uppercase tracking-widest">
            Payment Approval Required
          </span>
        </div>
        <span className="border border-white/40 bg-white/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
          Human In The Loop
        </span>
      </div>

      <div className="p-5">
        <p className="text-sm text-muted leading-6">
          {message ||
            "The agent has selected items and prepared your cart. Please authorize the payment to proceed with checkout."}
        </p>

        {/* Order detail */}
        <div className="mt-4 border-2 border-ink bg-canvas">
          <div className="flex items-center justify-between border-b border-ink/20 px-4 py-3">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted">
                Items Prepared
              </p>
              <p className="mt-0.5 text-sm font-bold">
                {itemsAdded.length} item{itemsAdded.length === 1 ? "" : "s"} in cart
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted">
                Total Amount
              </p>
              <p className="mt-0.5 text-2xl font-bold text-ink">
                {cartTotal > 0 ? formatINR(cartTotal) : "—"}
              </p>
            </div>
          </div>

          {Array.isArray(itemsAdded) && itemsAdded.length > 0 && (
            <div className="divide-y divide-ink/10">
              {itemsAdded.map((item, idx) => {
                const itemObj = (
                  typeof item === "object" && item !== null ? item : {}
                ) as Record<string, unknown>;
                const name = String(
                  itemObj.name || itemObj.product_name || `Item #${idx + 1}`
                );
                const price = typeof itemObj.price === "number" ? itemObj.price : null;
                const qty = typeof itemObj.quantity === "number" ? itemObj.quantity : 1;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-4 py-2 text-xs"
                  >
                    <span className="truncate text-muted">
                      {name} × {qty}
                    </span>
                    <span className="font-mono font-bold text-ink">
                      {price !== null ? formatINR(price * qty) : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 border-2 border-error bg-error/5 p-3 font-mono text-xs text-error">
            ⚠ {error}
          </p>
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            id="approve-payment-btn"
            onClick={() => void handleApprove()}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 border-2 border-ink bg-ink px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-brutal-sm transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:transform-none disabled:shadow-brutal-sm"
          >
            {loading === "approve" ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Authorizing...
              </>
            ) : (
              <>
                <Check size={15} strokeWidth={3} /> Approve & Checkout
              </>
            )}
          </button>

          <button
            id="reject-payment-btn"
            onClick={() => void handleReject()}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 border-2 border-ink bg-card px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-ink shadow-brutal-sm transition-all hover:bg-ink hover:text-white hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:transform-none disabled:shadow-brutal-sm"
          >
            {loading === "reject" ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Cancelling...
              </>
            ) : (
              <>
                <X size={15} strokeWidth={3} /> Decline
              </>
            )}
          </button>

          <Link
            href="/cart"
            className="ml-auto inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-widest text-muted underline hover:text-ink"
          >
            <ShoppingBag size={13} /> Review in cart <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}
