import { PagesFunction, Env } from "../types";
import { GoogleGenAI, Type } from "@google/genai";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { image, mimeType } = await context.request.json() as { image: string; mimeType: string };
    if (!image || !mimeType) {
      return new Response(JSON.stringify({ error: "Image data and mimeType are required" }), {
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

    return new Response(resultText, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error analyzing image:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to analyze image" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
