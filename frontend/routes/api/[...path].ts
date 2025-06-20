import type { FreshContext } from "fresh";

// Handler that catches all methods and proxies to backend
export const handler = (ctx: FreshContext): Response | Promise<Response> => {
  const method = ctx.req.method;
  
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Connect-Protocol-Version",
      },
    });
  }
  
  return proxyToBackend(ctx.req);
};

async function proxyToBackend(req: Request): Promise<Response> {
  const url = new URL(req.url);
  // Forward to backend, preserving the path after /api
  const backendUrl = `${Deno.env.get("BACKEND_URL") || "http://localhost:3007"}${url.pathname.replace('/api', '')}${url.search}`;
  
  const response = await fetch(backendUrl, {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });
  
  // Clone response to modify headers
  const modifiedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });
  
  // Ensure CORS headers are set
  modifiedResponse.headers.set("Access-Control-Allow-Origin", "*");
  modifiedResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  modifiedResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Connect-Protocol-Version");
  
  return modifiedResponse;
}