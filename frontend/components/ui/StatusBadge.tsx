export function StatusBadge({ status }: { status: string }) {
  const value = status.toLowerCase();
  const cls =
    value.includes("complete") || value === "success"
      ? "border-success bg-success text-white"
      : value.includes("fail") || value.includes("error")
      ? "border-error bg-error text-white"
      : value.includes("wait") || value.includes("pending")
      ? "border-warn bg-warn text-white"
      : "border-ink bg-ink text-white";

  return (
    <span
      className={`font-mono inline-flex border-2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${cls}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
