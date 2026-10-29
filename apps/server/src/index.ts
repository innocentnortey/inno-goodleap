// API server: mounts one route module per segment under /api. Owned by Foundation; segments never edit this file.
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import type { ApiError } from "@goodleap/shared";
import { applicationRoutes } from "./routes/application.ts";
import { askRoutes } from "./routes/ask.ts";
import { auditRoutes } from "./routes/audit.ts";
import { quoteRoutes } from "./routes/quote.ts";
import { MODEL } from "./llm/client.ts";

export const app = new Hono();

app.get("/api/health", (c) => c.json({ ok: true, model: MODEL, llmKey: Boolean(process.env.ANTHROPIC_API_KEY) }));
app.route("/api", quoteRoutes);
app.route("/api", askRoutes);
app.route("/api", auditRoutes);
app.route("/api", applicationRoutes);

app.notFound((c) => c.json<ApiError>({ error: { code: "not_found", message: "No such route." } }, 404));
// Never return stack traces or upstream error bodies to the browser (safe-validation-errors rule).
app.onError((err, c) => {
  console.error("[api] unhandled", err instanceof Error ? err.message : err);
  return c.json<ApiError>({ error: { code: "server_error", message: "Something went wrong on the server. Try again." } }, 500);
});

const port = Number(process.env.API_PORT || 8787);
serve({ fetch: app.fetch, port, hostname: "127.0.0.1" }, () => console.log(`[api] http://127.0.0.1:${port} · model ${MODEL}`));
