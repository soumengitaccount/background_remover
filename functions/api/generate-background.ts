import { PagesFunction, Env } from "../types";
import { GoogleGenAI } from "@google/genai";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { image, mimeType, prompt } = await context.request.json() as { image: string; mimeType: string; prompt: string };
    if (!image || !mimeType || !prompt) {
      return new Response(JSON.stringify({ error: "Image, mimeType, and prompt are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY environment variable is required" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

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

    return new Response(JSON.stringify({ image: base64Image }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error generating background:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to generate background" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
