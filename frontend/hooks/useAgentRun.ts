"use client";

import { useState } from "react";
import { startAgentRun } from "@/lib/api/agent";
import { DEMO_CART_ID, DEMO_USER_ID } from "@/lib/config";
import type { AgentRunResponse } from "@/types";

export function useAgentRun() {
  const [run, setRun] = useState<AgentRunResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(query: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await startAgentRun({
        query,
        user_id: DEMO_USER_ID,
        cart_id: DEMO_CART_ID
      });
      setRun(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to start the agent.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { run, loading, error, start };
}
