// Segment A: the deterministic quote engine. Pure functions: no I/O, no model. B (ask) and C (application agent) import
// quote, scenarioFor and FinanceError from here.
import type { Catalog, Priority, Product, Scenario } from "@goodleap/shared";
import { checkAmount, checkQuoteAmount } from "./errors.ts";
import { buildScenario } from "./scenario.ts";
import { addRelativeNotes, rankScenarios } from "./rank.ts";
export { FinanceError } from "./errors.ts";

/** Every catalog product as a Scenario for `amount`, ranked by `priority` (rank 1 = best). Throws FinanceError when
 *  the amount is outside catalog.amountRange. */
export function quote(amount: number, priority: Priority, catalog: Catalog): Scenario[] {
  checkQuoteAmount(amount, catalog.amountRange);
  return rankScenarios(addRelativeNotes(catalog.products.map((p) => buildScenario(amount, p))), priority);
}

/** One product's Scenario for `amount` (rank 0: unranked). */
export function scenarioFor(amount: number, product: Product): Scenario {
  checkAmount(amount);
  return buildScenario(amount, product);
}
