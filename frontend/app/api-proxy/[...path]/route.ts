import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = (
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

async function handleProxy(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const targetPath = (params.path || []).join("/");
  const search = request.nextUrl.search || "";
  const targetUrl = `${BACKEND_URL}/${targetPath}${search}`;

  const forwardHeaders = new Headers();
  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    // Do not forward host or connection
    if (lowerKey !== "host" && lowerKey !== "connection") {
      forwardHeaders.set(key, value);
    }
  });

  const method = request.method;
  const hasBody = !["GET", "HEAD"].includes(method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  try {
    const backendRes = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body,
      cache: "no-store"
    });

    const responseHeaders = new Headers();
    backendRes.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (lower !== "content-encoding" && lower !== "transfer-encoding") {
        responseHeaders.set(key, val);
      }
    });

    return new NextResponse(backendRes.body, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Proxy request failed";
    return NextResponse.json(
      { detail: `Cannot connect to PayAgent backend at ${BACKEND_URL}: ${message}` },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PATCH = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
