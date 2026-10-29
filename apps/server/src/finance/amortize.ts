// Pure amortization maths. Convention (matches WP-1): a displayed payment is round2(exact payment); a total is computed
// from the exact, unrounded payments and rounded once.
/** Level monthly payment at full precision (not rounded). Monthly compounding: r = aprPct / 100 / 12. */
export function paymentExact(principal: number, aprPct: number, months: number): number {
  const r = aprPct / 100 / 12;
  return r === 0 ? principal / months : (principal * r) / (1 - Math.pow(1 + r, -months));
}
