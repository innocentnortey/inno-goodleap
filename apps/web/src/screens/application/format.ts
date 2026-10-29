// Pure helpers for the application screens (SCR-3/4/5): display, parsing, editing. No model, no I/O.
import { formatUsd, type FieldGroup, type PrefillField } from "@goodleap/shared";

export const MONEY_KEYS = new Set(["project.estimateTotal", "project.downPayment", "financing.financedAmount", "income.grossAnnualIncome"]);
export const GROUPS: { group: FieldGroup; title: string }[] = [
  { group: "project", title: "Project" }, { group: "financing", title: "Financing" }, { group: "contractor", title: "Contractor" },
  { group: "you", title: "About you" }, { group: "income", title: "Income" },
];

export function displayValue(f: PrefillField): string {
  if (f.value === null || f.value === "") return "—";
  if (MONEY_KEYS.has(f.key) && typeof f.value === "number") return formatUsd(f.value);
  if (f.key === "project.projectType") {
    const s = String(f.value).replace(/_/g, " ");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  return String(f.value);
}

export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function editField(f: PrefillField, raw: string, by: "conversation" | "homeowner"): PrefillField | { error: string } {
  let value: string | number;
  if (MONEY_KEYS.has(f.key)) {
    const n = parseMoney(raw);
    if (n === null) return { error: "Enter a dollar amount, for example 30000." };
    value = n;
  } else {
    value = raw.trim();
    if (!value) return { error: "Enter a value." };
  }
  return { ...f, value, source: by, status: "ready", note: by === "homeowner" ? "Edited by the homeowner" : "Entered by the contractor", confidence: undefined, sourceQuote: undefined };
}

/** Refuses an edit that leaves the financed amount meaningless. Returns the inline error, or null. */
export function financedError(fields: PrefillField[]): string | null {
  const total = fields.find((f) => f.key === "project.estimateTotal")?.value;
  const down = fields.find((f) => f.key === "project.downPayment")?.value;
  if (typeof total === "number" && total <= 0) return "The total must be more than zero.";
  if (typeof total === "number" && typeof down === "number" && down >= total) return "The down payment must be less than the total.";
  return null;
}

/** Deterministic: the financed amount follows the edited estimate total and down payment. */
export function recomputeFinanced(fields: PrefillField[], by: "conversation" | "homeowner", selectedAmount?: number): PrefillField[] {
  const total = fields.find((f) => f.key === "project.estimateTotal")?.value;
  const down = fields.find((f) => f.key === "project.downPayment")?.value;
  if (typeof total !== "number" || typeof down !== "number") return fields;
  const value = Math.round((total - down) * 100) / 100;
  const differs = selectedAmount !== undefined && Math.abs(value - selectedAmount) > 0.004;
  return fields.map((f) => f.key === "financing.financedAmount"
    ? {
        ...f, value,
        status: differs ? "needs_review" : "ready",
        note: differs && f.status === "needs_review" && f.note ? f.note : differs ? "differs from the amount compared; check the estimate" : "computed by code from the edited figures",
        source: by === "homeowner" ? "homeowner" : f.source ?? "conversation",
      }
    : f);
}

export const isIncomplete = (f: PrefillField) =>
  f.status === "needs_input" || f.status === "needs_authorization" || f.value === null || f.value === "";
