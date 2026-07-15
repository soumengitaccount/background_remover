import { PagesFunction, Env } from "../types";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { image, mimeType } = await context.request.json() as { image: string; mimeType?: string };
    if (!image) {
      return new Response("Image parameter is required", { status: 400 });
    }

    let removeBackgroundFn;
    try {
      const pkg = await import("@imgly/background-removal-node");
      removeBackgroundFn = pkg.removeBackground;
    } catch (err: any) {
      return new Response(
        JSON.stringify({
          error: "Server-side background removal is not supported in Cloudflare Pages. Please run client-side background removal in the browser."
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const buffer = Buffer.from(image, "base64");
    // Must wrap in a typed Blob in Node.js to prevent "Unsupported format" error
    const blob = new Blob([buffer], { type: mimeType || "image/png" });

    // Run background removal model
    const resultBlob = await removeBackgroundFn(blob as any);
    const arrayBuffer = await resultBlob.arrayBuffer();
    const outputBuffer = Buffer.from(arrayBuffer);
    const base64 = outputBuffer.toString("base64");

    return new Response(JSON.stringify({ image: base64 }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Server-side background removal error:", error);
    return new Response("Failed to remove background: " + error.message, { status: 500 });
  }
};
