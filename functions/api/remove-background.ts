import { PagesFunction, Env } from "../types";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  return new Response(
    JSON.stringify({ 
      error: "This server-side endpoint is deprecated. Background removal is now processed fully client-side inside the browser for improved performance and privacy." 
    }), 
    { 
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
