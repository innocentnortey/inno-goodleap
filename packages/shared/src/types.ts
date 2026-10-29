// The one shared types file (skip S-2: no OpenAPI). Server routes and web screens both import from here.
// Owned by Foundation; a segment that needs a change asks the orchestrator.

// ---------- Catalog and quote (segment A) ----------

export type Priority = "lower_monthly" | "lower_total";
export type ProductKind = "fixed" | "intro" | "deferred";

export interface Product {
  id: string;
  name: string;
  kind: ProductKind;
  /** The APR that applies after any intro or promo period (for fixed products, the only APR). */
  aprPct: number;
  termMonths: number;
  introMonths?: number;
  introAprPct?: number;
  promoMonths?: number;
  /** Plain-words terms text; the only product text the SCR-2 model sees. */
  terms: string;
}

export interface Catalog {
  synthetic: true;
  description: string;
  catalogVersion: string;
  amountRange: { min: number; max: number };
  products: Product[];
}

/** One stretch of equal payments, e.g. 12 × $250.00 then 108 × $379.98. */
export interface PaymentPhase {
  months: number;
  payment: number;
  label: string;
}

/** TILA-style figures attached by code to every borrower-facing message. Never written by the model. */
export interface Disclosures {
  /** "Estimated, not an offer of credit or a credit decision." Always present. */
  estimateLine: string;
  aprPct?: number;
  termMonths?: number;
  /** Total cost of credit (finance charge), in dollars. */
  totalCostOfCredit?: number;
  /** Total of payments, in dollars. */
  totalPaid?: number;
  /** Extra lines (promo condition, RESPA settlement-cost line). */
  lines: string[];
}

export interface Scenario {
  /** `${productId}@${amount}` */
  id: string;
  productId: string;
  productName: string;
  kind: ProductKind;
  amount: number;
  aprPct: number;
  termMonths: number;
  /** Headline payment: the first phase's payment (for the deferred promo, the payoff payment). */
  monthlyPayment: number;
  phases: PaymentPhase[];
  totalPaid: number;
  totalInterest: number;
  /** Deferred-interest promo only. */
  promo?: { months: number; payoffMonthly: number; retroactiveInterest: number; condition: string };
  /** Short card note, e.g. "Payment rises after month 12". */
  note?: string;
  /** Position after ranking by the request's priority (1 = best). Behaviour-dependent products may rank last. */
  rank: number;
  disclosures: Disclosures;
  /** Every number the model may say about this scenario (dollars, percents, months). Guardrail check 1 uses it. */
  allowedNumbers: number[];
}

export interface QuoteRequest {
  amount: number;
  priority: Priority;
}

export interface QuoteResponse {
  catalogVersion: string;
  /** The catalog's financeable range, for the amount field's hint and error. */
  amountRange: { min: number; max: number };
  amount: number;
  priority: Priority;
  scenarios: Scenario[];
}

// ---------- Errors (every route) ----------

export interface ApiError {
  error: { code: string; message: string };
}

// ---------- Ask about this option + guardrails + audit (segment B) ----------

export interface AskRequest {
  productId: string;
  amount: number;
  question: string;
}

export type GuardrailName = "numbers" | "approval_language" | "disclosures";

export interface GuardrailCheck {
  name: GuardrailName;
  passed: boolean;
  detail: string;
}

export type AuditPurpose = "ask" | "exception_explain";
export type AnswerOutcome = "shown" | "regenerated" | "redirected" | "safe_template";

export interface GuardedAnswer {
  text: string;
  outcome: AnswerOutcome;
  disclosures: Disclosures;
  checks: GuardrailCheck[];
  attempts: number;
  auditId: string;
  latencyMs: number;
}

/** Input to the guarded generator (implemented by B in apps/server/src/guardrails/index.ts; used by B and C). */
export interface GuardedRequest {
  purpose: AuditPurpose;
  screen: "SCR-2" | "SCR-4";
  system: string;
  user: string;
  promptVersion: string;
  allowedNumbers: number[];
  disclosures: Disclosures;
  /** Returned (and logged) when the checks fail twice or the model refuses. */
  safeTemplate: string;
  productId?: string;
  catalogVersion?: string;
  /** What the audit record shows as the trigger: the homeowner's question or the event name. */
  auditInput: { question?: string; event?: string };
}

export interface AuditRecord {
  id: string;
  time: string;
  screen: string;
  purpose: AuditPurpose;
  productId: string | null;
  catalogVersion: string | null;
  promptVersion: string;
  model: string;
  inputs: { question?: string; event?: string; allowedNumbers: number[]; disclosures: Disclosures };
  /** Raw model output per attempt (empty for a redirect template). */
  rawOutput: string[];
  checks: GuardrailCheck[][];
  attempts: number;
  finalText: string;
  outcome: AnswerOutcome;
  latencyMs: number;
}

// ---------- Application prep, income, submit (segment C) ----------

export type FieldSource = "estimate" | "profile" | "conversation" | "homeowner" | "plaid" | "document";
export type FieldStatus = "ready" | "needs_input" | "needs_authorization" | "needs_review";
export type FieldGroup = "project" | "financing" | "contractor" | "you" | "income";

export interface PrefillField {
  key: string;
  label: string;
  group: FieldGroup;
  value: string | number | null;
  source: FieldSource | null;
  /** The text in the source document the value came from (estimate fields). */
  sourceQuote?: string;
  /** 0–1, model-reported for extracted fields; absent for code-computed or profile values. */
  confidence?: number;
  status: FieldStatus;
  /** Why it needs attention, or "computed by code". */
  note?: string;
}

export interface EstimateSample {
  id: string;
  name: string;
  contractorId: string;
  text: string;
}

export interface AgentStep {
  n: number;
  tool: string;
  summary: string;
  ms: number;
}

export interface PrepareRequest {
  /** One of the sample ids, or omitted when `estimateText` is an upload. */
  estimateId?: string;
  estimateText?: string;
  contractorId: string;
  productId: string;
  amount: number;
  priority: Priority;
}

export interface PreparedApplication {
  fields: PrefillField[];
  checklist: string[];
  agentSteps: AgentStep[];
  model: string;
  latencyMs: number;
}

export type PlaidDemoOutcome = "success" | "connection_failed" | "insufficient_data";

export interface PlaidRequest {
  demoOutcome: PlaidDemoOutcome;
}

export interface IncomeVerificationResult {
  status: "verified" | "failed" | "insufficient" | "document_review";
  source: "plaid" | "document";
  institution?: string;
  /** Template status line, e.g. "... Nothing was submitted and no decision was made." */
  statusLine: string;
  fields: PrefillField[];
  /** Guarded plain-words explanation on failure / insufficient (purpose exception_explain). */
  explanation?: GuardedAnswer;
}

export interface SubmitRequest {
  productId: string;
  amount: number;
  fields: PrefillField[];
  consents: { disclosuresRead: boolean; creditCheck: boolean; accurate: boolean };
}

export type CreditDecisionValue = "pending" | "conditional" | "approved" | "declined";

/** Produced only by the mocked credit engine, never by a model. */
export interface CreditDecision {
  decision: CreditDecisionValue;
  referenceId: string;
  message: string;
  nextSteps: string[];
  source: "credit_engine_mock";
}

// ---------- Roadmap (segment D) ----------

export interface RoadmapSource {
  label: string;
  url?: string;
  read?: string;
  status: "verified" | "partly_verified" | "not_found" | "assumption";
}

export interface RoadmapItem {
  title: string;
  friction: string;
  metric: string;
  whyItWaited: string;
}

export interface Roadmap {
  synthetic: true;
  description: string;
  baseline: { claim: string; source: RoadmapSource }[];
  demoChanges: { friction: string; screen: string; how: string }[];
  horizons: { name: string; items: RoadmapItem[] }[];
  assumptions: string[];
  notBuilt: { item: string; why: string }[];
}
