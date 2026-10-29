// Amount validation for the quote engine. Messages name the constraint and never echo the submitted value.
import { formatUsd0, round2, type Catalog } from "@goodleap/shared";

export class FinanceError extends Error {
  constructor(public code: "amount_below_min" | "amount_above_max" | "invalid_amount", message: string) { super(message); }
}

function checkFiniteCents(amount: number): void {
  if (typeof amount !== "number" || !Number.isFinite(amount) || round2(amount) !== amount) {
    throw new FinanceError("invalid_amount", "Amount must be a number of dollars and cents, for example 30000.");
  }
}

/** Used by scenarioFor: any positive dollars-and-cents amount. */
export function checkAmount(amount: number): void {
  checkFiniteCents(amount);
  if (amount <= 0) throw new FinanceError("invalid_amount", "Amount must be more than $0.");
}

/** Used by quote: also enforces the catalog range. */
export function checkQuoteAmount(amount: number, range: Catalog["amountRange"]): void {
  checkFiniteCents(amount);
  if (amount < range.min) throw new FinanceError("amount_below_min", `Amount is below the ${formatUsd0(range.min)} minimum.`);
  if (amount > range.max) throw new FinanceError("amount_above_max", `Amount is above the ${formatUsd0(range.max)} maximum.`);
}
