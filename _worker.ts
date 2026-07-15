import { onRequestGet as proxyImageHandler } from "./functions/api/proxy-image";
import { onRequestPost as removeBackgroundHandler } from "./functions/api/remove-background";
import { onRequestPost as analyzeImageHandler } from "./functions/api/analyze-image";
import { onRequestPost as generateBackgroundHandler } from "./functions/api/generate-background";

export interface Env {
  GEMINI_API_KEY?: string;
  ASSETS: {
    fetch: typeof fetch;
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Route GET /api/proxy-image
    if (url.pathname === "/api/proxy-image" && request.method === "GET") {
      try {
        return await proxyImageHandler({
          request,
          functionPath: url.pathname,
          waitUntil: (promise: Promise<any>) => ctx.waitUntil(promise),
          next: async (input?: Request | string, init?: RequestInit) => {
            return env.ASSETS.fetch(input || request, init);
          },
          env,
          params: {},
          data: {},
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: err.message || "Internal Server Error" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Route POST /api/remove-background
    if (url.pathname === "/api/remove-background" && request.method === "POST") {
      try {
        return await removeBackgroundHandler({
          request,
          functionPath: url.pathname,
          waitUntil: (promise: Promise<any>) => ctx.waitUntil(promise),
          next: async (input?: Request | string, init?: RequestInit) => {
            return env.ASSETS.fetch(input || request, init);
          },
          env,
          params: {},
          data: {},
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: err.message || "Internal Server Error" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Route POST /api/analyze-image
    if (url.pathname === "/api/analyze-image" && request.method === "POST") {
      try {
        return await analyzeImageHandler({
          request,
          functionPath: url.pathname,
          waitUntil: (promise: Promise<any>) => ctx.waitUntil(promise),
          next: async (input?: Request | string, init?: RequestInit) => {
            return env.ASSETS.fetch(input || request, init);
          },
          env,
          params: {},
          data: {},
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: err.message || "Internal Server Error" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Route POST /api/generate-background
    if (url.pathname === "/api/generate-background" && request.method === "POST") {
      try {
        return await generateBackgroundHandler({
          request,
          functionPath: url.pathname,
          waitUntil: (promise: Promise<any>) => ctx.waitUntil(promise),
          next: async (input?: Request | string, init?: RequestInit) => {
            return env.ASSETS.fetch(input || request, init);
          },
          env,
          params: {},
          data: {},
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: err.message || "Internal Server Error" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Default: serve static assets from Cloudflare Pages
    return env.ASSETS.fetch(request);
  },
};
