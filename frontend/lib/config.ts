const isBrowser = typeof window !== "undefined";

function resolveApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (isBrowser) {
    // In browser, use same-origin proxy to prevent CORS blocks from FastAPI
    if (!envUrl || envUrl.includes("localhost:8000") || envUrl.includes("127.0.0.1:8000")) {
      return "/api-proxy";
    }
    return envUrl.replace(/\/$/, "");
  }
  // Server-side connects directly to backend
  return (envUrl || process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
}

export const API_URL = resolveApiUrl();

export const DEMO_USER_ID = Number(
  process.env.NEXT_PUBLIC_DEMO_USER_ID || "1"
);

export const DEMO_CART_ID = Number(
  process.env.NEXT_PUBLIC_DEMO_CART_ID || "1"
);
