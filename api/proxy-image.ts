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
    res.status(200).send(buffer);
  } catch (error: any) {
    console.error("Proxy image error:", error);
    res.status(500).send("Failed to proxy image: " + error.message);
  }
}
