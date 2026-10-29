// Shared API routes; production adds only the built web entry and assets.
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import type { ApiError } from "@goodleap/shared";
import { applicationRoutes } from "./routes/application.ts";
import { askRoutes } from "./routes/ask.ts";
import { auditRoutes } from "./routes/audit.ts";
import { quoteRoutes } from "./routes/quote.ts";
import { MODEL } from "./llm/client.ts";

export function createApp({ webRoot }: { webRoot?: string } = {}) {
  const app = new Hono();

  app.get("/api/health", (c) => c.json({
    ok: true, model: MODEL, llmKey: Boolean(process.env.ANTHROPIC_API_KEY),
    version: process.env.RENDER_GIT_COMMIT ?? null,
  }));
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

  if (webRoot) {
    app.get("/", serveStatic({ path: `${webRoot}/index.html` }));
    app.get("/assets/*", serveStatic({ root: webRoot }));
  }
  return app;
}
