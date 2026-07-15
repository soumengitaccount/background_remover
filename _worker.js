import { onRequestGet as proxyImageHandler } from "./functions/api/proxy-image";
import { onRequestPost as removeBackgroundHandler } from "./functions/api/remove-background";
import { onRequestPost as analyzeImageHandler } from "./functions/api/analyze-image";
import { onRequestPost as generateBackgroundHandler } from "./functions/api/generate-background";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Map api endpoints to our Pages Function handlers
    if (url.pathname === "/api/proxy-image") {
      try {
        const context = {
          request,
          functionPath: url.pathname,
          waitUntil: (promise) => {
            if (typeof promise?.catch === "function") {
              promise.catch((err) => console.error("Error in waitUntil:", err));
            }
          },
          next: () => Promise.resolve(new Response("Not implemented", { status: 501 })),
          env,
          params: {},
          data: {},
        };
        return await proxyImageHandler(context);
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (url.pathname === "/api/remove-background") {
      try {
        const context = {
          request,
          functionPath: url.pathname,
          waitUntil: (promise) => {
            if (typeof promise?.catch === "function") {
              promise.catch((err) => console.error("Error in waitUntil:", err));
            }
          },
          next: () => Promise.resolve(new Response("Not implemented", { status: 501 })),
          env,
          params: {},
          data: {},
        };
        return await removeBackgroundHandler(context);
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (url.pathname === "/api/analyze-image") {
      try {
        const context = {
          request,
          functionPath: url.pathname,
          waitUntil: (promise) => {
            if (typeof promise?.catch === "function") {
              promise.catch((err) => console.error("Error in waitUntil:", err));
            }
          },
          next: () => Promise.resolve(new Response("Not implemented", { status: 501 })),
          env,
          params: {},
          data: {},
        };
        return await analyzeImageHandler(context);
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (url.pathname === "/api/generate-background") {
      try {
        const context = {
          request,
          functionPath: url.pathname,
          waitUntil: (promise) => {
            if (typeof promise?.catch === "function") {
              promise.catch((err) => console.error("Error in waitUntil:", err));
            }
          },
          next: () => Promise.resolve(new Response("Not implemented", { status: 501 })),
          env,
          params: {},
          data: {},
        };
        return await generateBackgroundHandler(context);
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Otherwise, fallback to serving static assets (default Pages behavior)
    return env.ASSETS.fetch(request);
  },
};
