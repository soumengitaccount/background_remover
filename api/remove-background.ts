import type { IncomingMessage, ServerResponse } from "http";

export interface VercelRequest extends IncomingMessage {
  query: { [key: string]: string | string[] | undefined };
  body: any;
}

export interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  send: (body: any) => VercelResponse;
  json: (jsonBody: any) => VercelResponse;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { image, mimeType } = req.body;
    if (!image) {
      return res.status(400).send("Image parameter is required");
    }

    // Dynamically import to avoid any potential runtime loading overhead
    const { removeBackground } = await import("@imgly/background-removal-node");

    const buffer = Buffer.from(image, "base64");
    // Wrap in a typed Blob in Node.js for @imgly/background-removal-node compatibility
    const blob = new Blob([buffer], { type: mimeType || "image/png" });
    
    // Run AI model
    const resultBlob = await removeBackground(blob);
    const arrayBuffer = await resultBlob.arrayBuffer();
    const outputBuffer = Buffer.from(arrayBuffer);
    const base64 = outputBuffer.toString("base64");

    res.status(200).json({ image: base64 });
  } catch (error: any) {
    console.error("Server-side background removal error:", error);
    res.status(500).send("Failed to remove background: " + error.message);
  }
}
