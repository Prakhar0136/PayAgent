import { AlertCircle } from "lucide-react";

export function Alert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-2 border-error bg-card p-4 text-sm shadow-brutal-sm"
    >
      <AlertCircle className="mt-0.5 shrink-0 text-error" size={16} strokeWidth={2.5} />
      <div>
        <p className="font-bold uppercase tracking-wide text-error">Error</p>
        <p className="mt-1 break-words text-muted">{message}</p>
      </div>
    </div>
  );
}
