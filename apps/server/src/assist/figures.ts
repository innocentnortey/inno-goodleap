// The model's figure list and the check's allowed set both come from the same computed scenario.
import { formatPct, formatUsd, round2 } from "@goodleap/shared";
import type { Product, Scenario } from "@goodleap/shared";

export interface Figure { label: string; value: number; unit: "usd" | "pct" | "months" }

export function scenarioFigures(scenario: Scenario, product: Product): Figure[] {
  const out: Figure[] = [];
  const add = (label: string, value: number | undefined, unit: Figure["unit"]) => {
    if (value === undefined) return;
    if (out.some((f) => f.label === label && f.value === value)) return;
    out.push({ label, value, unit });
  };
  add("Loan amount", scenario.amount, "usd");
  add("APR after any intro or promo period", scenario.aprPct, "pct");
  add("Loan term", scenario.termMonths, "months");
  add("Estimated monthly payment", scenario.monthlyPayment, "usd");
  for (const p of scenario.phases) {
    add(`${p.label}: number of payments`, p.months, "months");
    add(`${p.label}: estimated payment`, p.payment, "usd");
  }
  add("Total of payments", scenario.totalPaid, "usd");
  add("Total interest", scenario.totalInterest, "usd");
  if (product.introAprPct !== undefined) {
    add("Intro APR", product.introAprPct, "pct");
    add("Intro period", product.introMonths, "months");
  }
  if (scenario.promo) {
    add("Promo period", scenario.promo.months, "months");
    add("Monthly payment to clear the balance in the promo", scenario.promo.payoffMonthly, "usd");
    add("Retroactive interest if any balance remains after the promo", scenario.promo.retroactiveInterest, "usd");
  }
  add("Total cost of credit", scenario.disclosures.totalCostOfCredit, "usd");
  return out;
}

export function formatFigure(f: Figure): string {
  if (f.unit === "usd") return formatUsd(f.value);
  if (f.unit === "pct") return formatPct(f.value);
  return `${f.value} months`;
}

export function allowedNumbersFor(scenario: Scenario, figures: Figure[]): number[] {
  return [...new Set([...figures.map((f) => f.value), ...scenario.allowedNumbers].map(round2))];
}
