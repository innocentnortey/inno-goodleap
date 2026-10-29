// Segment C routes: estimates, application prepare, income verification, submit. Mounted under /api by src/index.ts.
import { Hono } from "hono";
import type { ApiError, Scenario } from "@goodleap/shared";
import { prepare } from "../application/prepare.ts";
import type { AgentBrakes } from "../application/agent.ts";
import { verifyWithDocument, verifyWithPlaid } from "../application/income.ts";
import type { Explain } from "../application/income.ts";
import { PlaidBody, PrepareBody, SubmitBody } from "../application/schemas.ts";
import { submitApplication } from "../application/submit.ts";
import { findProduct, listEstimates, loadCatalog } from "../data.ts";
import { scenarioFor } from "../finance/index.ts";
import { guardedGenerate } from "../guardrails/index.ts";
import { mockIntegrations } from "../integrations/index.ts";
import type { Integrations } from "../integrations/index.ts";
import { getLlm } from "../llm/client.ts";
import type { LlmClient } from "../llm/client.ts";

export interface ApplicationDeps {
  llm: () => LlmClient;
  integrations: Integrations;
  scenario: (amount: number, productId: string) => Scenario;
  explain: Explain;
  brakes?: AgentBrakes;
  now?: () => number;
}

export function defaultDeps(): ApplicationDeps {
  return {
    llm: getLlm,
    integrations: mockIntegrations(),
    scenario: (amount, id) => {
      const p = findProduct(id);
      if (!p) throw new Error("unknown product");
      return scenarioFor(amount, p);
    },
    explain: (req) => guardedGenerate(req),
  };
}

const err = (code: string, message: string): ApiError => ({ error: { code, message } });

export function buildApplicationRoutes(deps: ApplicationDeps): Hono {
  const app = new Hono();
  const incomeDeps = { plaid: deps.integrations.plaid, documents: deps.integrations.documents, explain: deps.explain };

  app.get("/estimates", (c) => c.json(listEstimates()));

  app.post("/application/prepare", async (c) => {
    const body = PrepareBody.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json(err("invalid_request", "The request is missing or has invalid fields."), 400);
    const b = body.data;
    let estimateText = b.estimateText;
    if (b.estimateId !== undefined) {
      estimateText = listEstimates().find((e) => e.id === b.estimateId)?.text;
      if (estimateText === undefined) return c.json(err("unknown_estimate", "No such sample estimate."), 400);
    }
    if (estimateText === undefined) return c.json(err("invalid_request", "The request is missing or has invalid fields."), 400);
    if (!(await deps.integrations.profiles.get(b.contractorId))) return c.json(err("unknown_contractor", "No such contractor."), 400);
    if (!findProduct(b.productId)) return c.json(err("unknown_product", "No such financing option."), 400);
    const { min, max } = loadCatalog().amountRange;
    if (b.amount < min || b.amount > max) return c.json(err("amount_out_of_range", "That amount is outside the range this demo finances."), 400);
    let llm: LlmClient;
    try { llm = deps.llm(); } catch {
      return c.json(err("llm_unavailable", "The AI service isn't configured on this server. Add ANTHROPIC_API_KEY and restart."), 503);
    }
    try {
      const out = await prepare(
        { ...b, estimateText },
        { llm, profiles: deps.integrations.profiles, scenario: deps.scenario, ...(deps.brakes && { brakes: deps.brakes }), ...(deps.now && { now: deps.now }) },
      );
      return c.json(out);
    } catch {
      console.error("[prepare] model call failed");
      return c.json(err("llm_error", "The assistant couldn't prepare the application. Try again."), 502);
    }
  });

  app.post("/income/plaid", async (c) => {
    const body = PlaidBody.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json(err("invalid_request", "The request is missing or has invalid fields."), 400);
    try { return c.json(await verifyWithPlaid(body.data.demoOutcome, incomeDeps)); } catch (e) {
      console.error("[income] plaid failed:", e instanceof Error ? e.message : "unknown");
      return c.json(err("income_unavailable", "Income verification isn't available right now. Try again."), 502);
    }
  });

  app.post("/income/document", async (c) => {
    try { return c.json(await verifyWithDocument(incomeDeps)); } catch (e) {
      console.error("[income] document failed:", e instanceof Error ? e.message : "unknown");
      return c.json(err("income_unavailable", "Income verification isn't available right now. Try again."), 502);
    }
  });

  app.post("/submit", async (c) => {
    const body = SubmitBody.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json(err("invalid_request", "The request is missing or has invalid fields."), 400);
    try {
      const out = await submitApplication(body.data, deps.integrations.engine);
      if (!out.ok) return c.json(err(out.code, out.message), 400);
      return c.json(out.decision);
    } catch (e) {
      console.error("[submit] engine failed:", e instanceof Error ? e.message : "unknown");
      return c.json(err("engine_unavailable", "The credit review isn't available right now. Try again."), 502);
    }
  });

  return app;
}

export const applicationRoutes = buildApplicationRoutes(defaultDeps());
