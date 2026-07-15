export interface Env {
  GEMINI_API_KEY?: string;
}

export type EventContext<Env, Params extends string, Data> = {
  request: Request;
  functionPath: string;
  waitUntil: (promise: Promise<any>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  env: Env;
  params: Record<Params, string>;
  data: Data;
};

export type PagesFunction<
  Env = any,
  Params extends string = any,
  Data extends Record<string, any> = any
> = (context: EventContext<Env, Params, Data>) => Response | Promise<Response>;
