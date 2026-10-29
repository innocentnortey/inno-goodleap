// Formatting and disclosure copy shared by the server (guardrails attach disclosures) and the web (renders them),
// so the words are identical on both sides. Owned by Foundation.

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** $1,234.56 */
export const formatUsd = (n: number) => usd.format(n);
/** $30,000 */
export const formatUsd0 = (n: number) => usd0.format(n);
/** 24.99% */
export const formatPct = (n: number) => `${n.toFixed(2)}%`;

export const ESTIMATE_LINE = "Estimated, not an offer of credit or a credit decision. The lender's credit review decides.";
export const RESPA_LINE =
  "Settlement costs: none are charged in this demo. Your contractor is not paid a referral fee for the loan option you pick.";
export const DEMO_LINE = "Concept prototype with synthetic products and rates.";
