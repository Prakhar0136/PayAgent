import { API_URL } from "@/lib/config";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers
      },
      cache: "no-store"
    });
  } catch {
    throw new ApiError(
      `Cannot connect to PayAgent API at ${API_URL}. Check that FastAPI is running and the URL is correct.`,
      0
    );
  }

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    if (payload && typeof payload === "object" && "detail" in payload) {
      const detail = (payload as { detail: unknown }).detail;
      message = typeof detail === "string" ? detail : JSON.stringify(detail);
    } else if (typeof payload === "string" && payload) {
      message = payload;
    }
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}
