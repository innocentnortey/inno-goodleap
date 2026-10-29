import type { PrepareRequest, PreparedApplication } from "@goodleap/shared";
import { findProduct } from "../data.ts";
import { DEFAULT_BRAKES, runAgent } from "./agent.ts";
import type { AgentBrakes, AgentDeps } from "./agent.ts";
import { buildChecklist, buildFields } from "./fields.ts";
import type { ScenarioSummary } from "./fields.ts";

export interface PrepareDeps extends AgentDeps { brakes?: AgentBrakes }
export type ValidPrepare = PrepareRequest & { estimateText: string };

export async function prepare(req: ValidPrepare, deps: PrepareDeps): Promise<PreparedApplication> {
  const t0 = Date.now();
  const ctx = { contractorId: req.contractorId, productId: req.productId, amount: req.amount, priority: req.priority, estimateText: req.estimateText };
  const run = await runAgent(ctx, deps, deps.brakes ?? DEFAULT_BRAKES);
  // Deterministic backfill by code (not an agent step). Extraction is not re-run: it is the call the brakes bound.
  if (run.results.profile === undefined) run.results.profile = await deps.profiles.get(ctx.contractorId);
  if (run.results.scenario === undefined) {
    try {
      const s = deps.scenario(ctx.amount, ctx.productId);
      const sum: ScenarioSummary = { productId: ctx.productId, productName: s.productName, amount: ctx.amount, aprPct: s.aprPct, termMonths: s.termMonths, monthlyPayment: s.monthlyPayment };
      run.results.scenario = sum;
    } catch { run.results.scenario = null; }
  }
  const fields = buildFields(ctx, run.results, findProduct(ctx.productId)?.name ?? ctx.productId);
  const checklist = buildChecklist(fields, run.stop !== "completed");
  return { fields, checklist, agentSteps: run.steps, model: deps.llm.model, latencyMs: Date.now() - t0 };
}
