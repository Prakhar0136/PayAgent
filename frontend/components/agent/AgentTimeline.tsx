"use client";

import { Check, Square, XCircle } from "lucide-react";
import type { AgentEvent } from "@/types";
import { eventDescription, friendlyEventName } from "@/lib/utils";

export function AgentTimeline({ events }: { events: AgentEvent[] }) {
  if (!events.length) {
    return (
      <div className="border-2 border-dashed border-ink bg-card p-8 text-center">
        <div className="font-mono text-3xl font-bold text-muted">[ ]</div>
        <p className="mt-3 font-bold uppercase tracking-wide">Waiting for agent events</p>
        <p className="mt-1 text-sm text-muted">
          Events will appear here once the agent starts reporting through SSE.
        </p>
      </div>
    );
  }

  return (
    <div className="border-2 border-ink bg-card shadow-brutal">
      <div className="border-b-2 border-ink px-5 py-3 bg-ink text-white flex items-center justify-between">
        <h2 className="font-mono text-xs font-bold uppercase tracking-widest">Agent Activity</h2>
        <span className="font-mono text-xs text-white/60">{events.length} events</span>
      </div>
      <ol className="divide-y divide-ink/10">
        {events.map((event, index) => {
          const type = String(event.event_type || event.type || "update");
          const failed =
            type.toLowerCase().includes("fail") || type.toLowerCase().includes("error");
          const completed =
            /done|completed|verified|found|selected|success|approved/i.test(type);
          const isLast = index === events.length - 1;

          return (
            <li
              key={`${String(event.timestamp ?? "event")}-${index}`}
              className={`flex gap-4 px-5 py-4 ${isLast && !completed && !failed ? "bg-accent/5" : ""}`}
            >
              {/* Status icon */}
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-2 ${
                  failed
                    ? "border-error bg-error text-white"
                    : completed
                    ? "border-success bg-success text-white"
                    : "border-ink bg-card text-ink"
                }`}
              >
                {failed ? (
                  <XCircle size={12} strokeWidth={2.5} />
                ) : completed ? (
                  <Check size={12} strokeWidth={3} />
                ) : (
                  <Square
                    size={8}
                    strokeWidth={0}
                    fill="currentColor"
                    className={isLast ? "blink" : ""}
                  />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{friendlyEventName(type)}</p>
                <p className="mt-0.5 break-words text-sm text-muted leading-5">
                  {eventDescription(event)}
                </p>
                {event.timestamp !== undefined && (
                  <p className="font-mono mt-1 text-[10px] uppercase tracking-widest text-muted/70">
                    {typeof event.timestamp === "number"
                      ? new Date(
                          event.timestamp < 10_000_000_000
                            ? event.timestamp * 1000
                            : event.timestamp
                        ).toLocaleTimeString()
                      : String(event.timestamp)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
