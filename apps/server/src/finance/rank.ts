// Ranking and relative notes. Pure.
import type { Priority, Scenario } from "@goodleap/shared";

/** The highest scheduled payment: for a 0% intro product this is the later payment, never the teaser. */
export function regularPayment(s: Scenario): number {
  return Math.max(...s.phases.map((p) => p.payment));
}

// Deviation from WP-1's table order (orchestrator-accepted): lower_monthly ranks by the highest regular payment, so
// FIX-10 (355.95) sits above INTRO-0 (379.98). The deferred product is always last: its cost depends on behaviour.
export function rankScenarios(scenarios: Scenario[], priority: Priority): Scenario[] {
  const ranked = scenarios.filter((s) => s.kind !== "deferred");
  const last = scenarios.filter((s) => s.kind === "deferred");
  const key = (s: Scenario) => (priority === "lower_monthly" ? regularPayment(s) : s.totalPaid);
  ranked.sort((a, b) => key(a) - key(b)); // stable: catalog order breaks ties
  return [...ranked, ...last].map((s, i) => ({ ...s, rank: i + 1 }));
}

export function addRelativeNotes(scenarios: Scenario[]): Scenario[] {
  const pool = scenarios.filter((s) => s.kind !== "deferred");
  if (pool.length === 0) return scenarios;
  const pick = (better: (a: Scenario, b: Scenario) => boolean) => pool.reduce((best, s) => (better(s, best) ? s : best));
  const lowestMonthly = pick((a, b) => regularPayment(a) < regularPayment(b));
  const highestInterest = pick((a, b) => a.totalInterest > b.totalInterest);
  const lowestInterest = pick((a, b) => a.totalInterest < b.totalInterest);
  const notes = new Map<string, string>();
  const give = (s: Scenario, note: string) => { if (!s.note && !notes.has(s.id)) notes.set(s.id, note); };
  give(lowestMonthly, lowestMonthly === highestInterest ? "Lowest monthly payment, highest total interest" : "Lowest monthly payment");
  give(lowestInterest, "Lowest total interest");
  return scenarios.map((s) => (notes.has(s.id) ? { ...s, note: notes.get(s.id) } : s));
}
