// Builds one unranked Scenario for a product and amount. Pure: no I/O, no model.
import { ESTIMATE_LINE, formatPct, formatUsd, formatUsd0, round2, type Disclosures, type PaymentPhase, type Product, type Scenario } from "@goodleap/shared";
import { paymentExact } from "./amortize.ts";

type Core = Pick<Scenario, "phases" | "totalPaid" | "totalInterest" | "monthlyPayment" | "note" | "promo"> & { extraNumbers: number[]; lines: string[] };

function fixed(amount: number, p: Product): Core {
  const exact = paymentExact(amount, p.aprPct, p.termMonths);
  const payment = round2(exact);
  const totalPaid = round2(exact * p.termMonths);
  return {
    phases: [{ months: p.termMonths, payment, label: `${p.termMonths} monthly payments` }],
    totalPaid, totalInterest: round2(totalPaid - amount), monthlyPayment: payment, extraNumbers: [], lines: [],
  };
}

function intro(amount: number, p: Product): Core {
  const introN = p.introMonths;
  const introApr = p.introAprPct ?? 0;
  if (introN === undefined || introApr !== 0) throw new Error("finance: intro products with a non-zero intro APR are not supported");
  const introExact = amount / p.termMonths;
  const remaining = amount - introExact * introN;
  const laterN = p.termMonths - introN;
  const laterExact = paymentExact(remaining, p.aprPct, laterN);
  const phases: PaymentPhase[] = [
    { months: introN, payment: round2(introExact), label: `Months 1–${introN}: 0% intro, principal only` },
    { months: laterN, payment: round2(laterExact), label: `Months ${introN + 1}–${p.termMonths} at ${formatPct(p.aprPct)} APR` },
  ];
  const totalPaid = round2(introExact * introN + laterExact * laterN);
  return {
    phases, totalPaid, totalInterest: round2(totalPaid - amount), monthlyPayment: phases[0].payment,
    note: `Payment rises after month ${introN}`,
    extraNumbers: [introN, introApr, introN + 1, remaining],
    lines: [`0% APR for the first ${introN} months (principal-only payments), then ${formatPct(p.aprPct)} APR on the remaining balance for ${laterN} months. This is not deferred interest: no interest is charged retroactively.`],
  };
}

function deferred(amount: number, p: Product): Core {
  const promoN = p.promoMonths;
  if (promoN === undefined) throw new Error("finance: deferred product without promoMonths");
  const payoffExact = amount / promoN;
  const payoff = round2(payoffExact);
  const totalPaid = round2(payoffExact * promoN);
  const retroactiveInterest = round2(amount * (p.aprPct / 100) * (promoN / 12));
  const condition = `No interest if the full balance is paid within ${promoN} months. If any balance remains after month ${promoN}, interest at ${formatPct(p.aprPct)} APR is charged from the start on the full ${formatUsd0(amount)}: about ${formatUsd(retroactiveInterest)}.`;
  return {
    phases: [{ months: promoN, payment: payoff, label: `Months 1–${promoN}: pays it off within the promo` }],
    totalPaid, totalInterest: round2(totalPaid - amount), monthlyPayment: payoff,
    promo: { months: promoN, payoffMonthly: payoff, retroactiveInterest, condition },
    note: `Only cheaper if paid off within ${promoN} months`,
    extraNumbers: [promoN, promoN / 12, retroactiveInterest], lines: [condition],
  };
}

export function buildScenario(amount: number, product: Product): Scenario {
  let core: Core;
  switch (product.kind) {
    case "fixed": core = fixed(amount, product); break;
    case "intro": core = intro(amount, product); break;
    case "deferred": core = deferred(amount, product); break;
    default: throw new Error("finance: unknown product kind");
  }
  const { extraNumbers, lines, ...rest } = core;
  const disclosures: Disclosures = {
    estimateLine: ESTIMATE_LINE, aprPct: product.aprPct, termMonths: product.termMonths,
    totalCostOfCredit: rest.totalInterest, totalPaid: rest.totalPaid, lines,
  };
  const nums = [amount, ...rest.phases.flatMap((p) => [p.payment, p.months]), rest.totalPaid, rest.totalInterest, product.aprPct, product.termMonths];
  if (product.termMonths % 12 === 0) nums.push(product.termMonths / 12);
  nums.push(...extraNumbers);
  return {
    id: `${product.id}@${amount}`, productId: product.id, productName: product.name, kind: product.kind, amount,
    aprPct: product.aprPct, termMonths: product.termMonths, ...rest, rank: 0, disclosures,
    allowedNumbers: [...new Set(nums.map(round2))],
  };
}
