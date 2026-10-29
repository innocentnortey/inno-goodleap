// Typed fetch helpers for /api. A non-2xx response throws ApiFailure carrying the server's ApiError message.
import type { ApiError } from "@goodleap/shared";

export class ApiFailure extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { method, headers: body === undefined ? undefined : { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiFailure(0, "network", "Couldn't reach the demo server. Is `npm run dev` running?");
  }
  const json = (await res.json().catch(() => null)) as T | ApiError | null;
  if (!res.ok) {
    const err = (json as ApiError | null)?.error;
    throw new ApiFailure(res.status, err?.code ?? "server_error", err?.message ?? "Something went wrong. Try again.");
  }
  return json as T;
}

export const api = {
  get: <T>(path: string) => call<T>("GET", path),
  post: <T>(path: string, body: unknown) => call<T>("POST", path, body),
};
