// Segment A: POST /quote. Mounted under /api by src/index.ts. Thin: validate, call the pure core, shape the response.
import { Hono } from "hono";
import type { ApiError, QuoteResponse, Scenario } from "@goodleap/shared";
import { loadCatalog } from "../data.ts";
import { FinanceError, quote } from "../finance/index.ts";

export const quoteRoutes = new Hono();

const bad = (code: string, message: string): ApiError => ({ error: { code, message } });

quoteRoutes.post("/quote", async (c) => {
  const raw: unknown = await c.req.json().catch(() => ({}));
  const body = (raw !== null && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const amount = body.amount;
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return c.json(bad("invalid_amount", "Amount must be a number of dollars, for example 30000."), 400);
  }
  const priority = body.priority;
  if (priority !== "lower_monthly" && priority !== "lower_total") {
    return c.json(bad("invalid_priority", 'Priority must be "lower_monthly" or "lower_total".'), 400);
  }
  const catalog = loadCatalog();
  let scenarios: Scenario[];
  try {
    scenarios = quote(amount, priority, catalog);
  } catch (e) {
    if (e instanceof FinanceError) return c.json(bad(e.code, e.message), 400);
    throw e;
  }
  return c.json<QuoteResponse>({ catalogVersion: catalog.catalogVersion, amountRange: catalog.amountRange, amount, priority, scenarios });
});
