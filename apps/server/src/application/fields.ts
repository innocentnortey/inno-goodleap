// Field catalogue, builders and checklist. Pure code: the model never writes a field value (R-7, R-9).
import type { FieldGroup, PrefillField, Priority } from "@goodleap/shared";
import type { ContractorProfile } from "../integrations/index.ts";
import type { PrepContext } from "./tools.ts";

export const LABELS: Record<string, string> = {
  "project.projectType": "Project type",
  "project.scopeSummary": "Scope of work",
  "project.estimateTotal": "Estimate total",
  "project.downPayment": "Down payment",
  "financing.financedAmount": "Amount to finance",
  "financing.product": "Financing option",
  "financing.priority": "Priority",
  "contractor.businessName": "Contractor",
  "contractor.licenseNo": "License number",
  "you.fullName": "Full name",
  "you.address": "Home address",
  "you.dateOfBirth": "Date of birth",
  "you.ssnLast4": "SSN (last 4 digits)",
  "income.grossAnnualIncome": "Gross annual income",
  "income.employer": "Employer",
};

export const MONEY_KEYS = new Set(["project.estimateTotal", "project.downPayment", "financing.financedAmount", "income.grossAnnualIncome"]);

export const PRIORITY_WORDS: Record<Priority, string> = { lower_monthly: "Lower monthly payment", lower_total: "Lower total cost" };

const groupOf = (key: string): FieldGroup => key.split(".")[0] as FieldGroup;

export function identityFields(): PrefillField[] {
  return ["you.fullName", "you.address", "you.dateOfBirth", "you.ssnLast4"].map((key) => ({
    key, label: LABELS[key]!, group: "you" as const, value: null, source: null, status: "needs_input" as const,
    note: "The homeowner types this on Review.",
  }));
}

export function incomePlaceholders(): PrefillField[] {
  return ["income.grossAnnualIncome", "income.employer"].map((key) => ({
    key, label: LABELS[key]!, group: "income" as const, value: null, source: null, status: "needs_authorization" as const,
    note: "The homeowner connects their bank on the next step.",
  }));
}

export interface ScenarioSummary { productId: string; productName: string; amount: number; aprPct: number; termMonths: number; monthlyPayment: number }
export type EstimateFields = PrefillField[];
/** `undefined` = tool not run; `null` = ran and failed. */
export interface ToolResults { profile?: ContractorProfile | null; scenario?: ScenarioSummary | null; estimate?: EstimateFields | null; missingListed: boolean }

const ESTIMATE_KEYS = ["project.projectType", "project.scopeSummary", "project.estimateTotal", "project.downPayment", "financing.financedAmount"];

export function buildFields(ctx: PrepContext, r: ToolResults, productName: string): PrefillField[] {
  const out: PrefillField[] = [];
  if (r.estimate) out.push(...r.estimate);
  else {
    for (const key of ESTIMATE_KEYS) {
      out.push({ key, label: LABELS[key]!, group: groupOf(key), value: null, source: null, status: "needs_input",
        note: "Not read: the assistant stopped before reading the estimate. Prepare again or enter it by hand." });
    }
  }
  out.push({ key: "financing.product", label: LABELS["financing.product"]!, group: "financing", value: r.scenario?.productName ?? productName, source: "conversation", status: "ready" });
  out.push({ key: "financing.priority", label: LABELS["financing.priority"]!, group: "financing", value: PRIORITY_WORDS[ctx.priority], source: "conversation", status: "ready" });
  if (r.profile) {
    out.push({ key: "contractor.businessName", label: LABELS["contractor.businessName"]!, group: "contractor", value: r.profile.businessName, source: "profile", status: "ready" });
    out.push({ key: "contractor.licenseNo", label: LABELS["contractor.licenseNo"]!, group: "contractor", value: r.profile.licenseNo, source: "profile", status: "ready" });
  } else {
    for (const key of ["contractor.businessName", "contractor.licenseNo"]) {
      out.push({ key, label: LABELS[key]!, group: "contractor", value: null, source: null, status: "needs_input", note: "Contractor profile not found." });
    }
  }
  out.push(...identityFields(), ...incomePlaceholders());
  // Group order: project (4), financing (financedAmount, product, priority), contractor, you, income.
  const order: FieldGroup[] = ["project", "financing", "contractor", "you", "income"];
  const idx = (f: PrefillField) => order.indexOf(f.group);
  const financed = out.filter((f) => f.key === "financing.financedAmount");
  const rest = out.filter((f) => f.key !== "financing.financedAmount");
  const merged: PrefillField[] = [];
  for (const g of order) {
    if (g === "financing") merged.push(...financed);
    merged.push(...rest.filter((f) => f.group === g));
  }
  return merged.sort((a, b) => idx(a) - idx(b));
}

export function buildChecklist(fields: PrefillField[], stoppedEarly: boolean): string[] {
  const lines: string[] = [];
  const add = (s: string) => { if (!lines.includes(s)) lines.push(s); };
  const status = (key: string) => fields.find((f) => f.key === key)?.status;
  if (stoppedEarly) add("The assistant stopped early; check every field.");
  if (status("project.estimateTotal") === "needs_input") add("Ask the contractor for the final total.");
  if (status("project.downPayment") === "needs_input") add("Confirm the down payment with the contractor.");
  const deal = (f: PrefillField) => f.group === "project" || f.group === "financing" || f.group === "contractor";
  for (const f of fields) {
    if (deal(f) && f.status === "needs_input" && f.key !== "project.estimateTotal" && f.key !== "project.downPayment") add(`Add the ${f.label.toLowerCase()}.`);
  }
  for (const f of fields) {
    if ((f.group === "project" || f.group === "financing") && f.status === "needs_review") add(`Check the ${f.label.toLowerCase()} against the estimate.`);
  }
  if (fields.some((f) => f.group === "income" && f.status === "needs_authorization")) add("Homeowner: verify income on the next step.");
  if (fields.some((f) => f.group === "you" && f.status === "needs_input")) add("Homeowner: enter name, address, date of birth and the last 4 of the SSN on Review.");
  add("Homeowner: read the disclosures and give the three consents.");
  return lines;
}
