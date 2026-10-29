// Pure output checks (no I/O, no SDK). Known limits: allowedNumbers is untyped, so a percent that equals an allowed
// month count (18% for DEF-18) passes; numbers written as words are not checked.
import { formatPct, formatUsd, round2 } from "@goodleap/shared";
import type { Disclosures, GuardrailCheck } from "@goodleap/shared";
import type { GuardrailPolicy } from "./policy.ts";

export function normalise(text: string): string {
  return text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
}

function blank(s: string, start: number, end: number): string {
  return s.slice(0, start) + " ".repeat(end - start) + s.slice(end);
}

export function checkNumbers(text: string, policy: GuardrailPolicy, allowedNumbers: number[]): GuardrailCheck {
  const allowed = allowedNumbers.map(round2);
  let rest = normalise(text);
  const seen: string[] = [];
  const failed: string[] = [];

  const moneyOk = (value: number, whole: boolean): boolean =>
    allowed.includes(round2(value)) ||
    (whole && allowed.some((a) => a >= 100 && Math.abs(a - value) <= policy.wholeDollarTolerance));
  const record = (written: string, ok: boolean) => { (ok ? seen : failed).push(written.trim()); };

  // Each pass reads from `rest` and blanks its matches, so a figure is counted once.
  const run = (re: RegExp, handle: (m: RegExpExecArray) => void) => {
    const snapshot = rest;
    const spans: [number, number][] = [];
    for (const m of snapshot.matchAll(re)) {
      handle(m as RegExpExecArray);
      spans.push([m.index, m.index + m[0].length]);
    }
    for (const [s, e] of spans) rest = blank(rest, s, e);
  };

  // 2. money
  run(/\$\s?(\d{1,3}(?:,\d{3})+|\d+)(\.\d{1,2})?(?:\s?(k|thousand|million)\b)?/gi, (m) => {
    let value = Number(`${m[1].replace(/,/g, "")}${m[2] ?? ""}`);
    const mult = m[3]?.toLowerCase();
    if (mult === "k" || mult === "thousand") value *= 1000;
    else if (mult === "million") value *= 1_000_000;
    record(m[0], moneyOk(value, !m[2]));
  });
  // 3. percent
  run(/(\d+(?:\.\d+)?)\s?(?:%|percent\b)/gi, (m) => record(m[0], allowed.includes(round2(Number(m[1])))));
  // 4. term
  run(/(\d+(?:\.\d+)?)[\s-]?(months?|mos?|payments?|installments?|years?|yrs?)\b/gi, (m) => {
    const v = Number(m[1]);
    const months = m[2].toLowerCase().startsWith("y") ? v * 12 : v;
    record(m[0], allowed.includes(round2(months)));
  });
  // 5. bare numbers
  run(/\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g, (m) => {
    const written = m[0];
    const value = Number(written.replace(/,/g, ""));
    const hasComma = written.includes(",");
    const decimals = written.includes(".") ? written.split(".")[1].length : 0;
    if (!(hasComma || decimals === 2 || value >= policy.bareNumberFloor)) return;
    record(written, moneyOk(value, decimals === 0));
  });

  if (failed.length > 0) return { name: "numbers", passed: false, detail: `Not in the computed numbers: ${failed.join(", ")}` };
  return { name: "numbers", passed: true, detail: seen.length ? `All figures match the computed numbers: ${seen.join(", ")}` : "No figures in the reply" };
}

export function checkApproval(text: string, policy: GuardrailPolicy): GuardrailCheck {
  const t = normalise(text);
  const hits: string[] = [];
  for (const rule of policy.approvalPhrases) {
    const m = rule.pattern.exec(t);
    if (m) hits.push(`Blocked wording: "${m[0]}" (${rule.label})`);
  }
  return hits.length
    ? { name: "approval_language", passed: false, detail: hits.join("; ") }
    : { name: "approval_language", passed: true, detail: "No approval or eligibility wording" };
}

export function checkDisclosures(disclosures: Disclosures): GuardrailCheck {
  if (!disclosures.estimateLine?.trim()) {
    return { name: "disclosures", passed: false, detail: "Missing the estimate line (not an offer of credit or a credit decision)" };
  }
  let detail = "Attached by code: estimate line";
  if (disclosures.aprPct !== undefined) detail += `, APR ${formatPct(disclosures.aprPct)}`;
  if (disclosures.termMonths !== undefined) detail += `, term ${disclosures.termMonths} months`;
  if (disclosures.totalCostOfCredit !== undefined) detail += `, total cost of credit ${formatUsd(disclosures.totalCostOfCredit)}`;
  if (disclosures.totalPaid !== undefined) detail += `, total of payments ${formatUsd(disclosures.totalPaid)}`;
  return { name: "disclosures", passed: true, detail };
}

export function runChecks(text: string, policy: GuardrailPolicy, allowedNumbers: number[], disclosures: Disclosures): GuardrailCheck[] {
  return [checkNumbers(text, policy, allowedNumbers), checkApproval(text, policy), checkDisclosures(disclosures)];
}
