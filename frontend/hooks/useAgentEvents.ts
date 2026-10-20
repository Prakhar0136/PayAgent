"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAgentEvents } from "@/lib/api/agent";
import type { AgentEvent } from "@/types";

export function useAgentEvents(runId: string | null, isFinished = false) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const loadEvents = useCallback(async () => {
    if (!runId) return;
    try {
      const response = await fetchAgentEvents(runId);
      if (!isMounted.current) return;
      if (Array.isArray(response.events)) {
        setEvents(response.events);
      }
      setConnected(true);
      setError(null);
    } catch {
      if (!isMounted.current) return;
      // If error occurs on initial poll or connection
      setConnected(false);
    }
  }, [runId]);

  useEffect(() => {
    isMounted.current = true;
    if (!runId) return;

    // Initial fetch immediately
    void loadEvents();

    if (isFinished) return;

    // Poll every 1.5s while the run is active
    const timer = setInterval(() => {
      void loadEvents();
    }, 1500);

    return () => {
      isMounted.current = false;
      clearInterval(timer);
    };
  }, [runId, isFinished, loadEvents]);

  return { events, connected, error, setEvents, refresh: loadEvents };
}
