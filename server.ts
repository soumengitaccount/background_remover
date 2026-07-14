import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import proxyImageHandler from "./api/proxy-image";
import removeBackgroundHandler from "./api/remove-background";

dotenv.config();

// Lazy initialization of Gemini as recommended by Guidelines
let aiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required in secrets");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  // Lock PORT to 3000 in development (as required by dev proxy) but allow dynamic PORT in production Cloud Run
  const PORT = process.env.NODE_ENV === "production" ? (process.env.PORT ? Number(process.env.PORT) : 3000) : 3000;

  // Body parser for base64 images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // CORS Proxy for external assets to prevent canvas tainting (delegated to Serverless Handler)
  app.get("/api/proxy-image", async (req, res) => {
    return proxyImageHandler(req as any, res as any);
  });

  // API Route: Remove image background (delegated to Serverless Handler)
  app.post("/api/remove-background", async (req, res) => {
    return removeBackgroundHandler(req as any, res as any);
  });

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
