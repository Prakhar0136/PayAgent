"use client";

import { ArrowUp, Sparkles } from "lucide-react";
import { useState } from "react";

const suggestions = [
  "Find lightweight running shoes under ₹3000",
  "Find wireless headphones under ₹5000",
  "Find a backpack under ₹2000",
];

export function AgentInput({
  loading,
  onSubmit,
}: {
  loading: boolean;
  onSubmit: (query: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");

  async function submit() {
    const trimmed = query.trim();
    if (!trimmed || loading) return;
    await onSubmit(trimmed);
  }

  return (
    <section className="border-2 border-ink bg-card shadow-brutal">
      {/* Header bar */}
      <div className="flex items-center gap-2 border-b-2 border-ink px-4 py-2.5 bg-ink text-white">
        <Sparkles size={13} strokeWidth={2.5} />
        <span className="font-mono text-[11px] font-bold uppercase tracking-widest">
          Shopping Assistant
        </span>
      </div>

      {/* Textarea */}
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void submit();
          }
        }}
        placeholder="Describe what you need, your budget, or your preferences..."
        rows={4}
        className="w-full resize-none border-0 bg-transparent px-4 py-4 text-base outline-none placeholder:text-muted"
        aria-label="Shopping request"
      />

      {/* Footer bar */}
      <div className="flex items-center justify-between gap-3 border-t-2 border-ink px-4 py-3">
        <p className="hidden font-mono text-[10px] text-muted sm:block uppercase tracking-widest">
          Enter↵ to send · Shift+Enter for new line
        </p>
        <button
          id="agent-submit-btn"
          onClick={() => void submit()}
          disabled={loading || !query.trim()}
          className="ml-auto inline-flex items-center gap-2 border-2 border-ink bg-accent px-5 py-2 text-sm font-bold uppercase tracking-wider text-white shadow-brutal-sm transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-brutal-sm"
        >
          {loading ? (
            <>
              <span className="font-mono">Starting...</span>
            </>
          ) : (
            <>
              Run Agent
              <ArrowUp size={15} strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>

      {/* Suggestions */}
      <div className="border-t border-ink/20 px-4 py-3 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setQuery(suggestion)}
            className="border border-ink/30 bg-canvas px-3 py-1 text-xs font-medium text-muted transition hover:border-ink hover:bg-ink hover:text-white"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </section>
  );
}
