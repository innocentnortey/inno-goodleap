// Submit: no model anywhere in this path (R-14). Checks run in code, then the mocked credit engine decides.
import type { CreditDecision, SubmitRequest } from "@goodleap/shared";
import type { CreditEngineClient } from "../integrations/index.ts";
import { LABELS } from "./fields.ts";

export type SubmitOutcome =
  | { ok: true; decision: CreditDecision }
  | { ok: false; code: "consent_required" | "fields_incomplete" | "income_not_verified" | "application_incomplete"; message: string };

export async function submitApplication(req: SubmitRequest, engine: CreditEngineClient): Promise<SubmitOutcome> {
  const c = req.consents;
  if (!(c.disclosuresRead && c.creditCheck && c.accurate)) return { ok: false, code: "consent_required", message: "Tick all three consents before submitting." };
  const n = req.fields.filter((f) => f.status === "needs_input").length;
  if (n > 0) return { ok: false, code: "fields_incomplete", message: `${n} field(s) still need input.` };
  if (req.fields.some((f) => f.group === "income" && f.status === "needs_authorization")) return { ok: false, code: "income_not_verified", message: "Verify income before submitting." };
  // Every field of the contract must be present; the homeowner-supplied ones must carry a value (a document-read income may stay flagged for review).
  const mustHaveValue = (k: string) => k.startsWith("you.") || k === "income.grossAnnualIncome";
  const incomplete = Object.keys(LABELS).some((k) => {
    const f = req.fields.find((x) => x.key === k);
    if (!f) return true;
    return mustHaveValue(k) && f.status !== "needs_review" && (f.value === null || f.value === "");
  });
  if (incomplete) return { ok: false, code: "application_incomplete", message: "The application is missing required fields. Go back and complete every section." };
  const decision = await engine.decide(req.fields);
  console.info(`[submit] decision=${decision.decision} ref=${decision.referenceId}`);
  return { ok: true, decision };
}
