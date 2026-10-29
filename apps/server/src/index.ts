import { serve } from "@hono/node-server";
import { resolve } from "node:path";
import { createApp } from "./app.ts";
import { REPO_ROOT } from "./data.ts";
import { serverOptions } from "./hosting.ts";
import { MODEL } from "./llm/client.ts";

export const app = createApp({
  webRoot: process.env.NODE_ENV === "production" ? resolve(REPO_ROOT, "apps/web/dist") : undefined,
});
const options = serverOptions(process.env);
const server = serve({ fetch: app.fetch, ...options }, () =>
  console.log(`[api] http://${options.hostname}:${options.port} · model ${MODEL}`));

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
