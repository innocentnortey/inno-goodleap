// Income verification. Code reads the mock sources; the AI never judges income (R-11), it only explains a failure.
import { ESTIMATE_LINE, formatUsd, round2 } from "@goodleap/shared";
import type { GuardedAnswer, GuardedRequest, IncomeVerificationResult, PlaidDemoOutcome } from "@goodleap/shared";
import type { DocumentIncomeClient, PlaidClient } from "../integrations/index.ts";
import { LABELS } from "./fields.ts";

export const EXPLAIN_PROMPT_VERSION = "explain-v1";
export const EXPLAIN_TEMPLATE_FAILED = "This happens when a bank's security check takes too long. You can try the connection again, or upload a recent pay stub instead; either way the lender's review decides, not this screen.";
export const EXPLAIN_TEMPLATE_INSUFFICIENT = "Bank verification needs a longer history of deposits than this account shows. You can upload a recent pay stub instead; either way the lender's review decides, not this screen.";
export const EXPLAIN_SYSTEM = "You explain, in two plain sentences, why a homeowner's bank connection for income verification did not finish, and what they can do next. Write no numbers, amounts, percentages or time periods. Do not comment on the homeowner's income or on any lending outcome; say only that the lender's review decides. Offer only the options you are given.";

export type Explain = (req: GuardedRequest) => Promise<GuardedAnswer>;
export interface IncomeDeps { plaid: PlaidClient; documents: DocumentIncomeClient; explain: Explain }

const explainUser = (event: string, institution: string) =>
  `Event: ${event}. Institution: ${institution}. Options: ${event === "insufficient_data" ? "upload a recent pay stub instead" : "try the bank connection again, or upload a recent pay stub instead"}.`;

async function safeExplain(explain: Explain, req: GuardedRequest): Promise<GuardedAnswer> {
  try { return await explain(req); } catch {
    console.warn("[income] explanation failed");
    return { text: req.safeTemplate, outcome: "safe_template", disclosures: req.disclosures, checks: [], attempts: 0, auditId: "none", latencyMs: 0 };
  }
}

export async function verifyWithPlaid(outcome: PlaidDemoOutcome, deps: IncomeDeps): Promise<IncomeVerificationResult> {
  const rec = await deps.plaid.connect(outcome);
  if (rec.status === "verified") {
    const src = rec.incomeSources[0];
    if (!src) throw new Error("plaid mock: no income source");
    return {
      status: "verified", source: "plaid", institution: rec.institution,
      statusLine: "Connected to Demo Credit Union. Income was read from 12 months of deposits. The lender's review decides, not this screen.",
      fields: [
        { key: "income.grossAnnualIncome", label: LABELS["income.grossAnnualIncome"]!, group: "income", value: src.annualizedGross, source: "plaid", status: "ready" },
        { key: "income.employer", label: LABELS["income.employer"]!, group: "income", value: src.employer, source: "plaid", status: "ready" },
      ],
    };
  }
  const failed = rec.status === "failed";
  const event = rec.status === "failed" ? rec.errorCode : "insufficient_data";
  const req: GuardedRequest = {
    purpose: "exception_explain", screen: "SCR-4",
    system: EXPLAIN_SYSTEM, user: explainUser(event, rec.institution),
    promptVersion: EXPLAIN_PROMPT_VERSION, allowedNumbers: [],
    disclosures: { estimateLine: ESTIMATE_LINE, lines: [] },
    safeTemplate: failed ? EXPLAIN_TEMPLATE_FAILED : EXPLAIN_TEMPLATE_INSUFFICIENT,
    auditInput: { event },
  };
  return {
    status: failed ? "failed" : "insufficient", source: "plaid", institution: rec.institution,
    statusLine: failed
      ? `We couldn't finish connecting to ${rec.institution}: the bank's extra verification step timed out. Nothing was submitted and no decision was made.`
      : `We connected to ${rec.institution} but found fewer than 3 months of deposits, so your income couldn't be verified this way. Nothing was submitted and no decision was made.`,
    fields: [],
    explanation: await safeExplain(deps.explain, req),
  };
}

export async function verifyWithDocument(deps: IncomeDeps): Promise<IncomeVerificationResult> {
  const rec = await deps.documents.read();
  if (rec.extracted.payFrequency !== "biweekly") throw new Error("document income: unsupported pay frequency");
  const annual = round2(rec.extracted.grossPay * 26);
  return {
    status: "document_review", source: "document",
    statusLine: `We read your pay stub (${rec.document}). The lender's team reviews it before any decision.`,
    fields: [
      { key: "income.grossAnnualIncome", label: LABELS["income.grossAnnualIncome"]!, group: "income", value: annual, source: "document", status: "needs_review",
        note: `computed by code: ${formatUsd(rec.extracted.grossPay)} biweekly gross pay × 26` },
      { key: "income.employer", label: LABELS["income.employer"]!, group: "income", value: rec.extracted.employer, source: "document", status: "needs_review",
        confidence: rec.confidence, note: "Read from the pay stub; the lender's team reviews it." },
    ],
  };
}
