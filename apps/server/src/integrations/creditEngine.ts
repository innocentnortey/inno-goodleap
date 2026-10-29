// The mocked credit decision engine: code decides, never a model (R-14). It can only return pending or conditional.
import type { CreditDecision, CreditDecisionValue, PrefillField } from "@goodleap/shared";
import { readSynthetic } from "../data.ts";
import type { CreditEngineClient } from "./types.ts";

interface EngineRecord { decision: CreditDecisionValue; referenceId: string; message: string; nextSteps: string[] }

export class CreditEngineMock implements CreditEngineClient {
  async decide(fields: PrefillField[]): Promise<CreditDecision> {
    const { outcomes } = readSynthetic<{ outcomes: { pending: EngineRecord; conditional: EngineRecord } }>("credit-engine.json");
    const conditional = fields.some((f) => f.group === "income" && (f.source === "document" || f.status === "needs_review"));
    const rec = conditional ? outcomes.conditional : outcomes.pending;
    if (rec.decision !== "pending" && rec.decision !== "conditional") throw new Error("credit engine mock: unexpected decision");
    return { decision: rec.decision, referenceId: rec.referenceId, message: rec.message, nextSteps: [...rec.nextSteps], source: "credit_engine_mock" };
  }
}
