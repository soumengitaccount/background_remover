import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { Request as ExpressRequest, Response as ExpressResponse } from "express";

// Import Cloudflare Pages Function handlers
import { onRequestGet as proxyImageHandler } from "./functions/api/proxy-image";
import { onRequestPost as removeBackgroundHandler } from "./functions/api/remove-background";
import { onRequestPost as analyzeImageHandler } from "./functions/api/analyze-image";
import { onRequestPost as generateBackgroundHandler } from "./functions/api/generate-background";

dotenv.config();

/**
 * Adapter to translate Express request/response into standard Web Request/Response objects
 * and invoke a Cloudflare Pages Function.
 */
async function runPagesFunction(
  handler: any,
  req: ExpressRequest,
  res: ExpressResponse
) {
  try {
    const protocol = req.protocol;
    const host = req.get("host");
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;

    // Read and serialize body for POST/PUT/PATCH requests
    let body: any = undefined;
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      if (typeof req.body === "object") {
        body = JSON.stringify(req.body);
      } else {
        body = req.body;
      }
    }

    // Map Express headers to standard Headers
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      } else if (value !== undefined) {
        headers.set(key, value);
      }
    }

    const webRequest = new Request(fullUrl, {
      method: req.method,
      headers,
      body,
    });

    // Create Cloudflare Pages event context
    const context = {
      request: webRequest,
      functionPath: req.path,
      waitUntil: (promise: Promise<any>) => {
        promise.catch((err) => console.error("Error in waitUntil:", err));
      },
      next: async () => {
        return new Response("Not implemented", { status: 501 });
      },
      env: {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      },
      params: req.params,
      data: {},
    };

    // Execute the Cloudflare Pages Function handler
    const webResponse = await handler(context);

    // Send status code
    res.status(webResponse.status);

    // Map standard response headers back to Express response headers
    webResponse.headers.forEach((value: string, key: string) => {
      res.setHeader(key, value);
    });

    // Send response body
    const contentType = webResponse.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const json = await webResponse.json();
      res.json(json);
    } else {
      const arrayBuffer = await webResponse.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    }
  } catch (error: any) {
    console.error("Pages Function Adapter Error:", error);
    res.status(500).send("Internal Server Error in Pages adapter: " + error.message);
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Body parser for base64 images & payload handling
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Route incoming API requests to Cloudflare Pages Function adapters
  app.get("/api/proxy-image", (req, res) => runPagesFunction(proxyImageHandler, req, res));
  app.post("/api/remove-background", (req, res) => runPagesFunction(removeBackgroundHandler, req, res));
  app.post("/api/analyze-image", (req, res) => runPagesFunction(analyzeImageHandler, req, res));
  app.post("/api/generate-background", (req, res) => runPagesFunction(generateBackgroundHandler, req, res));

  // Vite integration for dev server or static server in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
