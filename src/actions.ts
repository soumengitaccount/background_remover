"use server";

/**
 * React Server Action to proxy an external image via serverless handlers
 * to bypass CORS policies and prevent canvas-tainting.
 * Returns a Promise that resolves to a Base64 data URL.
 */
export async function proxyImageAction(url: string): Promise<string> {
  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`Server Action error: Failed to proxy image. Status: ${response.status}`);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * React Server Action to execute the AI background removal.
 * Isolates the subject and returns a Promise containing the Base64 output.
 */
export async function removeBackgroundAction(
  base64Payload: string,
  mimeType: string
): Promise<{ image: string }> {
  const response = await fetch("/api/remove-background", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: base64Payload,
      mimeType,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Server Action error: Background removal failed.");
  }

  return response.json();
}
