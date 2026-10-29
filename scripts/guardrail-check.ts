// Offline proof that the checks block crafted bad outputs and pass good ones. No network, no model.
import { ESTIMATE_LINE } from "@goodleap/shared";
import type { Disclosures, GuardrailName } from "@goodleap/shared";
import { runChecks } from "../apps/server/src/guardrails/checks.ts";
import { POLICY } from "../apps/server/src/guardrails/policy.ts";

const WP2_DEF18_ALLOWED = [30000, 1666.67, 18, 24.99, 11245.5, 84, 0];
const DISCLOSURES: Disclosures = { estimateLine: ESTIMATE_LINE, aprPct: 24.99, termMonths: 84, totalPaid: 30000, lines: [] };
const G1 =
  "If any balance is left after month 18, interest at 24.99% is charged from day one on the whole $30,000: about $11,245.50 added. To avoid that you'd pay about $1,666.67 a month for 18 months. Want to see the full terms?";

interface Case { id: string; text: string; disclosures?: Disclosures; mustFail?: GuardrailName }
const CASES: Case[] = [
  { id: "B1 wrong payment", text: "You'd pay about $1,500 a month for 18 months.", mustFail: "numbers" },
  { id: "B2 approved", text: "You're approved for the 0% plan at $250 a month!", mustFail: "approval_language" },
  { id: "B3 qualify", text: "Good news: you qualify for this promo.", mustFail: "approval_language" },
  { id: "B4 invented rate", text: "The rate is 5.99% APR after the promo.", mustFail: "numbers" },
  { id: "B5 guaranteed", text: "This plan gives you guaranteed savings over the fixed options.", mustFail: "approval_language" },
  { id: "B6 no risk", text: "There's no risk: just pay it off and you owe nothing extra.", mustFail: "approval_language" },
  { id: "B7 wrong term", text: "The loan runs for 60 months after the promo ends.", mustFail: "numbers" },
  { id: "B8 pre-approved", text: "You're pre-approved, so you can start the project today.", mustFail: "approval_language" },
  { id: "B9 afford", text: "At $1,666.67 a month you can afford it easily.", mustFail: "approval_language" },
  { id: "B10 wrong promo months", text: "Pay it off within 12 months to avoid any interest.", mustFail: "numbers" },
  { id: "B11 wrong interest", text: "If a balance remains you'd owe about $9,000 in interest.", mustFail: "numbers" },
  { id: "B12 you'll get", text: "You’ll get the lowest rate we offer.", mustFail: "approval_language" },
  { id: "B13 missing disclosure", text: G1, disclosures: { estimateLine: "", lines: [] }, mustFail: "disclosures" },
  { id: "B14 good shape", text: "You're in good shape for this.", mustFail: "approval_language" },
  { id: "B15 payments count", text: "Over 24 payments of $1,666.67.", mustFail: "numbers" },
  { id: "B16 small dollars", text: "That's only $19 a month extra.", mustFail: "numbers" },
  { id: "G1 WP-2 answer", text: G1 },
  {
    id: "G2 rounded + years",
    text: "Paying about $1,667 a month clears the $30,000 balance within 18 months, so no interest is added. If a balance remains, the loan runs 7 years at 24.99% APR. Want to see the full terms?",
  },
];

const mark = (passed: boolean) => (passed ? "pass" : "FAIL");
const rows: string[][] = [["id", "expected", "numbers", "wording", "disclosures", "result"]];
let badBlocked = 0, badTotal = 0, goodPassed = 0, goodTotal = 0;

for (const c of CASES) {
  const cs = runChecks(c.text, POLICY, WP2_DEF18_ALLOWED, c.disclosures ?? DISCLOSURES);
  const by = (n: GuardrailName) => cs.find((x) => x.name === n)!.passed;
  let ok: boolean;
  if (c.mustFail) {
    badTotal++;
    ok = !by(c.mustFail);
    if (ok) badBlocked++;
  } else {
    goodTotal++;
    ok = cs.every((x) => x.passed);
    if (ok) goodPassed++;
  }
  rows.push([c.id, c.mustFail ? `block ${c.mustFail}` : "pass all", mark(by("numbers")), mark(by("approval_language")), mark(by("disclosures")), ok ? "OK" : "WRONG"]);
}

const widths = rows[0].map((_, i) => Math.max(...rows.map((r) => r[i].length)));
for (const r of rows) console.log(r.map((v, i) => v.padEnd(widths[i])).join(" | "));
console.log(`\n${badBlocked}/${badTotal} bad outputs blocked · ${goodPassed}/${goodTotal} good outputs passed`);
if (badBlocked !== badTotal || goodPassed !== goodTotal) process.exitCode = 1;
