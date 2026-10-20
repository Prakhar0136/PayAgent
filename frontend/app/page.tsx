"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { AgentInput } from "@/components/agent/AgentInput";
import { Alert } from "@/components/ui/Alert";
import { useAgentRun } from "@/hooks/useAgentRun";

export default function HomePage() {
  const router = useRouter();
  const { loading, error, start } = useAgentRun();

  async function handleSubmit(query: string) {
    try {
      const result = await start(query);
      window.sessionStorage.setItem("payagent:last-run", JSON.stringify(result));
      router.push(`/agent/${encodeURIComponent(result.run_id)}`);
    } catch {
      // Error is displayed below the input.
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Hero */}
      <div className="py-10 sm:py-16">
        <div className="inline-flex items-center gap-2 border-2 border-ink bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-widest shadow-brutal-sm">
          <Zap size={12} strokeWidth={2.5} />
          <span>Your Personal AI Shopping Assistant</span>
        </div>
        <h1 className="mt-6 max-w-3xl text-5xl font-bold tracking-tight sm:text-7xl leading-none">
          What can I{" "}
          <span className="text-accent underline decoration-2 underline-offset-4">
            shop for you?
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">
          Tell PayAgent what you need. It will search your catalog, check availability, and help prepare your cart.
        </p>
      </div>

      {/* Input */}
      <AgentInput loading={loading} onSubmit={handleSubmit} />
      {error && (
        <div className="mt-4">
          <Alert message={error} />
        </div>
      )}

      {/* Feature cards */}
      <div className="mt-8 grid gap-0 sm:grid-cols-3 border-2 border-ink shadow-brutal">
        <Feature
          icon={<Zap size={16} strokeWidth={2.5} />}
          tag="01"
          title="Instant Discovery"
          text="Specify products, brands, or price limits in natural everyday language."
        />
        <Feature
          icon={<CheckCircle2 size={16} strokeWidth={2.5} />}
          tag="02"
          title="Live Stock Verification"
          text="Real-time catalog search and warehouse inventory validation."
        />
        <Feature
          icon={<ShieldCheck size={16} strokeWidth={2.5} />}
          tag="03"
          title="Human Authorized"
          text="Review all prepared items and authorize payment before completion."
          last
        />
      </div>

      {/* Explore CTA */}
      <div className="mt-8 border-2 border-ink bg-card p-6 sm:p-7 shadow-brutal">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
              // Browse
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">
              Explore Our Complete Collection
            </h2>
            <p className="mt-1 text-sm text-muted">
              Browse available catalog products or manage the items in your shopping cart.
            </p>
          </div>
          <ArrowRight className="hidden shrink-0 sm:block mt-1" size={22} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/products"
            className="border-2 border-ink bg-ink px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-brutal-sm transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            Browse Catalog
          </Link>
          <Link
            href="/cart"
            className="border-2 border-ink bg-card px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-ink shadow-brutal-sm transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            Open Cart
          </Link>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon,
  tag,
  title,
  text,
  last,
}: {
  icon: React.ReactNode;
  tag: string;
  title: string;
  text: string;
  last?: boolean;
}) {
  return (
    <div
      className={`bg-card p-5 ${
        last ? "" : "border-b-2 border-ink sm:border-b-0 sm:border-r-2 sm:border-ink"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center border-2 border-ink bg-accent text-white">
          {icon}
        </div>
        <span className="font-mono text-xs font-bold text-muted">{tag}</span>
      </div>
      <h2 className="mt-4 text-sm font-bold uppercase tracking-wide">{title}</h2>
      <p className="mt-1 text-sm leading-5 text-muted">{text}</p>
    </div>
  );
}
