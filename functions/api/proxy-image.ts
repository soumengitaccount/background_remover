import { PagesFunction, Env } from "../types";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const imageUrl = url.searchParams.get("url");

    if (!imageUrl) {
      return new Response("URL parameter is required", { status: 400 });
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return new Response(`Failed to fetch image: ${response.status} ${response.statusText}`, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error("Proxy image error:", error);
    return new Response("Failed to proxy image: " + error.message, { status: 500 });
  }
};
