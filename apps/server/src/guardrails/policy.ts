// Guardrail policy: data only. Approval words and redirect templates live here and nowhere else;
// checks.ts and index.ts read them from this file.

export interface PhraseRule { label: string; pattern: RegExp }   // no g flag: no lastIndex state
export type RedirectKind = "eligibility" | "other_lender";
export interface RedirectRule { kind: RedirectKind; pattern: RegExp }
export interface GuardrailPolicy {
  approvalPhrases: PhraseRule[];
  /** A whole-dollar figure (no cents written) may differ from an allowed number by up to this many dollars. */
  wholeDollarTolerance: number;
  /** A bare number (no $, %, unit, comma or cents) below this is a count and is not checked. */
  bareNumberFloor: number;
  /** Total model calls per request, including the one regeneration. */
  maxAttempts: number;
}

export const APPROVAL_PHRASES: PhraseRule[] = [
  { label: "qualify", pattern: /\bqualif(?:y|ies|ied|ying|ication)\b/i },
  { label: "approved", pattern: /\b(?:pre-?)?approv\w*/i },
  { label: "pre-qualified", pattern: /\bpre-?qualif\w*/i },
  { label: "good shape", pattern: /\bgood shape\b/i },
  { label: "will go through", pattern: /\b(?:should|will) go through\b/i },
  { label: "will say yes", pattern: /\bwill (?:probably |likely )?(?:say yes|like (?:this|it|you))\b/i },
  { label: "sure thing", pattern: /\bsure thing\b/i },
  { label: "won't have trouble", pattern: /\bwon'?t have (?:any )?trouble\b/i },
  { label: "no credit check", pattern: /\bno credit check\b/i },
  { label: "definitely", pattern: /\bdefinitely\b/i },
  { label: "guaranteed", pattern: /\bguarantee(?:d|s)?\b/i },
  { label: "you'll get", pattern: /\byou(?:'ll| will) get\b/i },
  { label: "no risk", pattern: /\bno[- ]risk\b/i },
  { label: "risk-free", pattern: /\brisk[- ]free\b/i },
  { label: "eligible", pattern: /\beligib(?:le|ility)\b/i },
  { label: "good chance", pattern: /\bgood chance\b/i },
  { label: "likely to be approved", pattern: /\blikely to (?:be approved|qualify|get)\b/i },
  { label: "you can afford", pattern: /\byou can (?:easily )?afford\b/i },
  { label: "you'll be fine", pattern: /\byou(?:'ll| will| should) be fine\b/i },
];

export const POLICY: GuardrailPolicy = { approvalPhrases: APPROVAL_PHRASES, wholeDollarTolerance: 1, bareNumberFloor: 100, maxAttempts: 2 };

export const REDIRECT_RULES: RedirectRule[] = [
  { kind: "eligibility", pattern: /\b(?:qualif\w*|eligib\w*|approv\w*|pre-?approv\w*|denied|deny|turned down|get (?:the|this|a) loan|will i get)\b/i },
  { kind: "eligibility", pattern: /\b(?:afford|am i good for|good enough credit)\b/i },
  { kind: "eligibility", pattern: /\b(?:credit score|fico|my credit|bad credit|credit check|credit history)\b/i },
  { kind: "other_lender", pattern: /\b(?:other|another|different) (?:lender|lenders|bank|banks|company|loan company)\b|\bcompetitor/i },
];

/** Masks obvious identifiers and strips angle brackets before a question reaches the model or the audit log. Dollar amounts are kept. */
export function redactQuestion(q: string): string {
  return q
    .replace(/[<>]/g, "")
    .replace(/\b\d{3}-?\d{2}-?\d{4}\b/g, "[SSN]")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g, "[email]")
    .replace(/(?<![\d$,.])(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/g, "[phone]");
}

/** First matching rule's kind, case-insensitive. */
export function classifyRedirect(question: string): RedirectKind | null {
  for (const r of REDIRECT_RULES) if (r.pattern.test(question)) return r.kind;
  return null;
}

export const OFF_TOPIC_SENTINEL = "OFF_TOPIC";
export const ELIGIBILITY_REDIRECT = "I can't say whether you'd qualify; that's decided by the lender's credit review after you apply. I can explain how any of these options works.";
export const OTHER_LENDER_REDIRECT = "I can only explain the options shown here, not other lenders' products. I can explain how any of these options works.";
export const OFF_TOPIC_REDIRECT = "I can only answer questions about this loan option and how it works. Try asking about the payments, the rate, or what happens if your plans change.";
export const ASK_SAFE_TEMPLATE = "I can't give a reliable answer to that one here. The figures on this option and the full terms below are accurate, and the lender can answer anything else.";
export const REDIRECT_TEMPLATES: Record<RedirectKind, string> = { eligibility: ELIGIBILITY_REDIRECT, other_lender: OTHER_LENDER_REDIRECT };
