import { apiFetch } from "@/lib/api/client";
import type {
  AgentEventsResponse,
  AgentFinalResponse,
  AgentRunRequest,
  AgentRunResponse,
  AgentStatusResponse
} from "@/types";

export function startAgentRun(body: AgentRunRequest): Promise<AgentRunResponse> {
  return apiFetch<AgentRunResponse>("/agent/run", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function getAgentStatus(threadId: string): Promise<AgentStatusResponse> {
  return apiFetch<AgentStatusResponse>(`/agent/status/${encodeURIComponent(threadId)}`);
}

export function approveAgentPayment(threadId: string, note?: string): Promise<AgentFinalResponse> {
  return apiFetch<AgentFinalResponse>(`/agent/approve/${encodeURIComponent(threadId)}`, {
    method: "POST",
    body: JSON.stringify({ note })
  });
}

export function rejectAgentPayment(threadId: string, reason?: string): Promise<AgentFinalResponse> {
  return apiFetch<AgentFinalResponse>(`/agent/reject/${encodeURIComponent(threadId)}`, {
    method: "POST",
    body: JSON.stringify({ reason })
  });
}

export function fetchAgentEvents(runId: string): Promise<AgentEventsResponse> {
  return apiFetch<AgentEventsResponse>(`/agents/${encodeURIComponent(runId)}/events`);
}

export function getAgentEventsUrl(runId: string): string {
  return `/agents/${encodeURIComponent(runId)}/events`;
}
