import type { AnswerOutcome, AuditPurpose, GuardrailName } from "@goodleap/shared";

export const OUTCOME_WORD: Record<AnswerOutcome, string> = {
  shown: "Shown", regenerated: "Shown after one retry", redirected: "Redirected", safe_template: "Fallback template",
};
export const PURPOSE_WORD: Record<AuditPurpose, string> = { ask: "Ask about this option", exception_explain: "Income explanation" };
export const CHECK_WORD: Record<GuardrailName, string> = { numbers: "Numbers", approval_language: "Wording", disclosures: "Disclosures" };
