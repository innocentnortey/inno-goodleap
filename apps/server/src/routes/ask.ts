// POST /api/ask (SCR-2) and GET /api/terms/:productId. Mounted under /api by src/index.ts.
import { Hono } from "hono";
import { z } from "zod";
import type { ApiError, GuardedAnswer } from "@goodleap/shared";
import { ask, AskError } from "../assist/ask.ts";
import { findProduct } from "../data.ts";

export const askRoutes = new Hono();

const AskBody = z.object({
  productId: z.string().min(1).max(40),
  amount: z.number().finite(),
  question: z.string().trim().min(1).max(500),
});

askRoutes.post("/ask", async (c) => {
  const invalid = () =>
    c.json<ApiError>({ error: { code: "invalid_request", message: "Send productId, a numeric amount and a question of 1–500 characters." } }, 400);
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return invalid();
  }
  const parsed = AskBody.safeParse(body);
  if (!parsed.success) return invalid();
  try {
    return c.json<GuardedAnswer>(await ask(parsed.data));
  } catch (e) {
    if (e instanceof AskError) return c.json<ApiError>({ error: { code: e.code, message: e.message } }, e.status);
    throw e;
  }
});

askRoutes.get("/terms/:productId", (c) => {
  const p = findProduct(c.req.param("productId"));
  return p
    ? c.json({ productId: p.id, name: p.name, terms: p.terms })
    : c.json<ApiError>({ error: { code: "unknown_product", message: "No such product in the catalog." } }, 404);
});
