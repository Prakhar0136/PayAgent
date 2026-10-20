export function Loading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-4 border-2 border-ink bg-card p-5 text-sm shadow-brutal-sm">
      <span className="font-mono text-xl font-bold text-ink animate-pulse">■</span>
      <span className="font-mono text-xs uppercase tracking-widest text-muted">{label}</span>
    </div>
  );
}
