import { formatINR } from "@/lib/utils";
import type { AgentRunResponse } from "@/types";

export function RunSummary({ run }: { run: AgentRunResponse }) {
  const summary = run.cart_summary || {};
  const budget = typeof run.budget === "number" ? run.budget : null;
  const cartTotal =
    typeof run.cart_total === "number"
      ? run.cart_total
      : typeof summary.total === "number"
      ? summary.total
      : null;
  const itemsCount = Array.isArray(run.items_added)
    ? run.items_added.length
    : (run.chosen_count ?? "—");

  return (
    <div className="border-2 border-ink bg-card shadow-brutal">
      {/* Header */}
      <div className="border-b-2 border-ink bg-ink px-5 py-3">
        <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-white">
          Run Summary
        </h2>
      </div>

      <div className="p-5 space-y-4">
        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Status" value={String(run.status || "Running").replaceAll("_", " ")} />
          <Metric label="Items Added" value={itemsCount} />
          {run.products_found !== undefined && (
            <Metric label="Products Found" value={run.products_found} />
          )}
          {run.in_stock_count !== undefined && (
            <Metric label="In Stock" value={run.in_stock_count} />
          )}
        </div>

        {/* Cart total */}
        {cartTotal !== null && cartTotal > 0 && (
          <div className="border-2 border-ink bg-canvas p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
              Cart Total
            </p>
            <p className="mt-1 font-mono text-3xl font-bold text-ink">{formatINR(cartTotal)}</p>
          </div>
        )}

        {/* Budget */}
        {budget !== null && (
          <div className="border border-ink/30 bg-canvas p-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Budget Detected
            </p>
            <p className="mt-1 font-mono text-xl font-bold text-ink">{formatINR(budget)}</p>
          </div>
        )}

        {/* Agent message */}
        {(run.message || run.final_message) && (
          <div className="border-l-4 border-ink bg-canvas px-4 py-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted">
              Agent Note
            </p>
            <p className="mt-1.5 text-sm leading-6 text-ink">
              {run.message || run.final_message}
            </p>
          </div>
        )}

        {/* Error */}
        {run.error && (
          <p className="border-2 border-error bg-error/5 p-3 font-mono text-xs text-error">
            ⚠ {run.error}
          </p>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-2 border-ink bg-canvas p-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold capitalize">{value}</p>
    </div>
  );
}
