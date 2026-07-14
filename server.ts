import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { removeBackground } from "@imgly/background-removal-node";

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

const app = express();

  // Body parser for base64 images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // CORS Proxy for external assets to prevent canvas tainting
  app.get("/api/proxy-image", async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl) {
        return res.status(400).send("URL parameter is required");
      }
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.send(buffer);
    } catch (error: any) {
      console.error("Proxy image error:", error);
      res.status(500).send("Failed to proxy image: " + error.message);
    }
  });

  // API Route: Remove image background using server-side deep learning
  app.post("/api/remove-background", async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      if (!image) {
        return res.status(400).send("Image parameter is required");
      }

      const buffer = Buffer.from(image, "base64");
      // Must wrap in a typed Blob in Node.js to prevent "Unsupported format" error in @imgly/background-removal-node
      const blob = new Blob([buffer], { type: mimeType || "image/png" });
      
      // Run background removal model on Node.js
      const resultBlob = await removeBackground(blob);
      const arrayBuffer = await resultBlob.arrayBuffer();
      const outputBuffer = Buffer.from(arrayBuffer);
      const base64 = outputBuffer.toString("base64");

      res.json({ image: base64 });
    } catch (error: any) {
      console.error("Server-side background removal error:", error);
      res.status(500).send("Failed to remove background: " + error.message);
    }
  });

  // API Route: Analyze Image & suggest backgrounds (using gemini-3.5-flash, free)
  app.post("/api/analyze-image", async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      if (!image || !mimeType) {
        return res.status(400).json({ error: "Image data and mimeType are required" });
      }

      const ai = getGeminiClient();
      const imagePart = {
        inlineData: {
          mimeType,
          data: image,
        },
      };

      const promptPart = {
        text: `Analyze this image and identify the primary foreground subject. 
Provide a descriptive title/label, a brief description of the subject, and 5 creative, highly specific prompt ideas for generating custom background backdrops that would complement this subject beautifully (e.g. "a pristine oak wood table with soft bokeh lighting", "a professional minimalist photography studio with soft shadows", "an architectural concrete display stand").
Respond strictly in JSON format matching the following structure:
{
  "subjectTitle": "short name of subject",
  "subjectDescription": "brief description of subject",
  "backgroundSuggestions": [
    {
      "theme": "Studio / Catalog",
      "prompt": "prompt text"
    },
    ...
  ]
}`,
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, promptPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subjectTitle: { type: Type.STRING },
              subjectDescription: { type: Type.STRING },
              backgroundSuggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    theme: { type: Type.STRING },
                    prompt: { type: Type.STRING },
                  },
                  required: ["theme", "prompt"],
                },
              },
            },
            required: ["subjectTitle", "subjectDescription", "backgroundSuggestions"],
          },
        },
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("No response text from Gemini API");
      }

      res.json(JSON.parse(resultText));
    } catch (error: any) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ error: error.message || "Failed to analyze image" });
    }
  });

  // API Route: Generate AI background backdrop (using gemini-3.1-flash-lite-image, paid)
  app.post("/api/generate-background", async (req, res) => {
    try {
      const { image, mimeType, prompt } = req.body;
      if (!image || !mimeType || !prompt) {
        return res.status(400).json({ error: "Image, mimeType, and prompt are required" });
      }

      const ai = getGeminiClient();
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts: [
            {
              inlineData: {
                data: image,
                mimeType,
              },
            },
            {
              text: `Place this foreground subject on a newly generated background. The background should be: "${prompt}". Blend the subject seamlessly into this background with matching light source, professional shadows, and clean edges. Keep the subject itself completely unmodified, realistic, and intact.`,
            },
          ],
        },
      });

      let base64Image = "";
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            base64Image = part.inlineData.data;
            break;
          }
        }
      }

      if (!base64Image) {
        let textResponse = "";
        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.text) {
              textResponse += part.text;
            }
          }
        }
        throw new Error(textResponse || "Failed to generate image backdrop. Ensure your API key has access to image editing models.");
      }

      res.json({ image: base64Image });
    } catch (error: any) {
      console.error("Error generating background:", error);
      res.status(500).json({ error: error.message || "Failed to generate background" });
    }
  });

// Vite integration for dev server or static server in production
if (!process.env.VERCEL) {
  const PORT = 3000;
  if (process.env.NODE_ENV !== "production") {
    createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then((vite) => {
      app.use(vite.middlewares);
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

export default app;
