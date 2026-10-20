"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, PackageCheck, X } from "lucide-react";
import { AgentTimeline } from "@/components/agent/AgentTimeline";
import { PaymentApprovalCard } from "@/components/agent/PaymentApprovalCard";
import { RunSummary } from "@/components/agent/RunSummary";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAgentEvents } from "@/hooks/useAgentEvents";
import type { AgentFinalResponse, AgentRunResponse } from "@/types";

export default function AgentRunPage({ params }: { params: { runId: string } }) {
  const runId = decodeURIComponent(params.runId);
  const [run, setRun] = useState<AgentRunResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalResult, setApprovalResult] = useState<AgentFinalResponse | null>(null);

  const isCompleted = run?.status === "completed" || approvalResult?.status === "completed";
  const isCancelled = run?.status === "cancelled" || approvalResult?.status === "cancelled";
  const isFailed = Boolean(run?.error || approvalResult?.error || run?.status === "failed");
  const isFinished = isCompleted || isCancelled || isFailed;

  const { events, connected, refresh } = useAgentEvents(runId, isFinished);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem("payagent:last-run");
      if (saved) {
        const parsed = JSON.parse(saved) as AgentRunResponse;
        if (parsed.run_id === runId) {
          setRun(parsed);
        }
      }
    } catch {
      setError("Could not read the saved run response from this browser session.");
    } finally {
      setLoading(false);
    }
  }, [runId]);

  function handleApprovalResolved(result: AgentFinalResponse) {
    setApprovalResult(result);
    setRun((prev) =>
      prev
        ? {
            ...prev,
            status: result.status,
            order_id: result.order_id,
            final_message: result.final_message || prev.final_message,
            error: result.error || null,
          }
        : prev
    );
    void refresh();
  }

  const currentStatus = isFailed
    ? "failed"
    : approvalResult
    ? approvalResult.status
    : run?.status
    ? run.status
    : "running";

  const showApprovalCard =
    Boolean(run?.thread_id) && run?.status === "awaiting_approval" && !approvalResult;

  const orderId = approvalResult?.order_id || run?.order_id;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={14} strokeWidth={2.5} /> ← New Request
      </Link>

      {/* Page header */}
      <div className="border-2 border-ink bg-card p-5 shadow-brutal">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
              // Agent Run
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">Your Shopping Request</h1>
            <p className="font-mono mt-2 break-all text-[10px] text-muted">
              RUN: {runId}
            </p>
          </div>
          <StatusBadge status={currentStatus} />
        </div>
      </div>

      {loading && <Loading label="Loading run details..." />}
      {error && <Alert message={error} />}

      {/* Order success */}
      {orderId && (
        <div className="border-2 border-success bg-card p-5 shadow-brutal">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-success bg-success text-white">
                <Check size={20} strokeWidth={3} />
              </div>
              <div>
                <h3 className="font-bold text-success uppercase tracking-wide">
                  Order #{orderId} Created Successfully!
                </h3>
                <p className="font-mono text-xs text-muted">
                  Payment approved and checkout process finished.
                </p>
              </div>
            </div>
            <Link
              href={`/orders/${orderId}`}
              className="inline-flex items-center gap-1.5 border-2 border-success bg-success px-4 py-2 text-sm font-bold uppercase tracking-wider text-white shadow-brutal-sm transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <PackageCheck size={15} /> View Order
            </Link>
          </div>
        </div>
      )}

      {/* Cancelled */}
      {isCancelled && !orderId && (
        <div className="flex items-center gap-3 border-2 border-ink bg-card p-4 text-sm shadow-brutal-sm">
          <X size={18} className="shrink-0 text-muted" strokeWidth={2.5} />
          <div>
            <p className="font-bold uppercase tracking-wide">Payment Cancelled</p>
            <p className="font-mono text-xs text-muted">
              The items remain in your cart for manual checkout or modifications.
            </p>
          </div>
        </div>
      )}

      {/* Payment approval card */}
      {showApprovalCard && run?.thread_id && (
        <PaymentApprovalCard
          threadId={run.thread_id}
          cartTotal={run.cart_total}
          itemsAdded={run.items_added}
          message={run.message}
          onResolved={handleApprovalResolved}
        />
      )}

      {/* Timeline + Summary */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <div className="space-y-3">
          {/* Live indicator */}
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted">
            <span
              className={`h-2 w-2 border border-ink ${
                connected ? "bg-success blink" : "bg-warn"
              }`}
            />
            {connected ? "Live event polling active" : "Checking agent events..."}
          </div>
          <AgentTimeline events={events} />
        </div>

        {run ? (
          <RunSummary run={run} />
        ) : (
          <div className="border-2 border-ink bg-card p-5 shadow-brutal">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
              // Activity
            </p>
            <h2 className="mt-3 font-bold tracking-tight">Session Activity</h2>
            <p className="mt-1 text-sm text-muted">
              The agent coordinates catalog discovery, inventory checks, and cart preparation in real-time.
            </p>
            <p className="font-mono mt-3 text-xs text-muted">
              Events received: {events.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
