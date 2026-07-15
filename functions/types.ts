export interface Env {
  GEMINI_API_KEY?: string;
  SESSION_SECRET?: string;
}

/**
 * Event context for Cloudflare Pages Functions
 */
export type EventContext<EnvType, Params extends string, Data> = {
  request: Request;
  functionPath: string;
  waitUntil: (promise: Promise<any>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  env: EnvType;
  params: Record<Params, string>;
  data: Data;
};

/**
 * Standard PagesFunction signature
 */
export type PagesFunction<
  EnvType = Env,
  Params extends string = any,
  Data extends Record<string, any> = any
> = (context: EventContext<EnvType, Params, Data>) => Response | Promise<Response>;

/**
 * Configure cookie session storage helper using @remix-run/cloudflare
 */
export async function getSessionStorage(env: Env) {
  const secret = env.SESSION_SECRET || "default-session-secret-change-me-in-production";
  const { createCookieSessionStorage } = await import("@remix-run/cloudflare");
  return createCookieSessionStorage({
    cookie: {
      name: "__session",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secrets: [secret],
      secure: true,
    },
  });
}

