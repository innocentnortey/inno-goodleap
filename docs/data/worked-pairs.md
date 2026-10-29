# Worked pairs

Each pair is an input the product receives and the output it must produce, worked by hand before any code. Numbers
were computed on 2026-10-29 (standard amortization, monthly compounding). Marks: **easy/hard**, **sure/uncertain**.

## WP-1 · Quote maths — easy, sure (becomes `finance.test.ts`)

**Input:** amount $30,000, priority "lower monthly payment", catalog `2026-10-29`.

**Output (ranked by monthly payment):**

| Product | Monthly | Total paid | Total interest | Note shown on the card |
|---|---|---|---|---|
| GL-FIX-25 | $261.90 | $78,570.15 | $48,570.15 | Lowest monthly, highest total interest |
| GL-FIX-15 | $286.70 | $51,605.21 | $21,605.21 | — |
| GL-INTRO-0 | $250.00 × 12, then $379.98 × 108 | $44,037.66 | $14,037.66 | Payment rises after month 12 |
| GL-FIX-10 | $355.95 | $42,713.85 | $12,713.85 | — |
| GL-FIX-05 | $593.89 | $35,633.67 | $5,633.67 | Lowest total interest |
| GL-DEF-18 | $1,666.67 × 18 to clear it | $30,000.00 if cleared | $0 if cleared; **$11,245.50** retroactive interest (simple, 24.99% × 1.5 yr) if any balance remains | Flagged: "only cheaper if paid off in 18 months" |

**Build note (2026-10-29, segment A):** the table's order for "lower monthly payment" matches no single rule
(INTRO-0's first payment is the lowest of all; its later payment is above FIX-10's). The build ranks by the highest
scheduled payment, so the order is FIX-25, FIX-15, FIX-10, INTRO-0, FIX-05, DEF-18. Totals reproduce this table
when computed from unrounded payments and rounded once. Every figure above is unchanged and tested.

With priority "lower total cost" the order is FIX-05, FIX-10, INTRO-0, FIX-15, FIX-25, with DEF-18 shown separately because its cost depends on behaviour. Amount $4,000 → error "below the $5,000 minimum". Spot checks: $15,000 on FIX-15 = $143.35; $45,000 = $430.04.

## WP-2 · Guarded answer — hard, uncertain (becomes 3 live checks + the guardrail script)

**Context the model sees:** product `GL-DEF-18` terms text; scenario numbers {amount 30,000; payoff 1,666.67/mo; promo 18 months; APR 24.99%; retroactive interest 11,245.50}.

| Question | Expected output | Guardrail result |
|---|---|---|
| "What happens if I don't pay it all off in 18 months?" | "If any balance is left after month 18, interest at 24.99% is charged from day one on the whole $30,000: about $11,245.50 added. To avoid that you'd pay about $1,666.67 a month for 18 months. Want to see the full terms?" + disclosures (APR 24.99%, 84-month term, total cost of credit, "estimated; not an offer or a credit decision") | pass: all numbers in the allowed set; no approval words |
| "Will I qualify for this?" | Redirect template: "I can't say whether you'd qualify; that's decided by the lender's credit review after you apply. I can explain how any of these options works." | n/a (template, still logged) |
| "What's the weather tomorrow?" | Off-topic template | n/a |
| *Crafted bad output for the script:* "You're approved for the 0% plan at $250 a month!" | blocked by check 2 (approval language) → regenerate → safe template | fail → safe template, logged |
| *Crafted:* "You'd pay about $1,500 a month for 18 months." | blocked by check 1 (1,500 not in allowed numbers) | fail |

**Why uncertain:** reading level and tone are judged by eye; the number tolerance (rounding to the dollar) needs a decision in code.

## WP-3 · Estimate extraction → prefill — hard, uncertain (becomes the 3-estimate check)

**Input:** `roof_messy.txt` (line items, "30 sq", "deposit recvd (2,000)", "BAL DUE 28,000").

**Output:**

| Field | Value | Source quote | Confidence | Status |
|---|---|---|---|---|
| projectType | roof_replacement | "tear off 1 layer comp … arch shingles" | 0.95 | ready |
| estimateTotal | 30,000 | "TOTAL  30,000" | 0.97 | ready |
| downPayment | 2,000 | "deposit recvd 10/27 .... (2,000)" | 0.90 | ready |
| financedAmount | 28,000 | *computed by code* = total − deposit; cross-checked against "BAL DUE 28,000" | — | ready |
| scopeSummary | "Full tear-off and replacement, ~24 squares / 2,400 sq ft, architectural shingles, 25-yr workmanship warranty" | several | 0.85 | ready |
| contractor | ABC Roofing LLC (C-1001) | profile service, matched on "ABC ROOFING" | — | ready (source: profile) |
| homeowner name / address / identity | — | — | — | needs_input |
| income | — | — | — | needs_authorization |

`roof_clean.txt` → same fields, deposit 0, financed 30,000. `hvac_missing_total.txt` → projectType `hvac_replacement` (0.9), estimateTotal **missing → `needs_input`** with the note "pricing to be confirmed after attic inspection"; the agent's checklist says "Ask the contractor for the final total". **Never** an invented number.

**Why uncertain:** whether the model reliably treats "(2,000)" as a deposit and not a line item; validation ranges catch the worst case.

## WP-4 · Plaid failure → recovery — easy, sure (becomes the Playwright friction path)

**Input:** homeowner taps *Connect bank (fails)* → `plaid.connection_failed` (`INSTITUTION_MFA_TIMEOUT`).

**Output on SCR-4:**
1. Status: "We couldn't finish connecting to Demo Credit Union: the bank's extra verification step timed out. Nothing was submitted and no decision was made."
2. Guarded explanation (purpose `exception_explain`, numbers: none; disclosures: the standard line): "This happens when a bank's security check takes too long. You can try the connection again, or upload a recent pay stub instead; either way the lender's review decides, not this screen."
3. Two actions: **Try again** (→ `success` on the second demo tap) and **Upload a pay stub** (→ `paystub.json` → income fields filled with source `document`, status `needs_review`, annualised $68,900.00 computed by code).
4. The audit log gets one record for the explanation.

**Why sure:** it's canned data and templates; the only model text is the explanation, and it carries no numbers.
