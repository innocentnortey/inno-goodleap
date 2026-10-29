# Segment A plan: Quote and compare (no AI)

Planner: `fanout-planner` (Opus 5.5), 2026-10-29 ~01:50 CT. Implementer: `fanout-implementer` (Sonnet).
Readiness: **READY** (see §9). No git commits in this repo (Innocent has not said so). Do not start or stop any server:
the API (127.0.0.1:8787, `tsx watch`) and Vite (127.0.0.1:5173, proxies `/api`) are already running and hot-reload.

---

## 1. Goal and sources

Deliver the deterministic quote engine, `POST /api/quote`, and screen SCR-1 *Compare options*, so that $30,000 shows
the top three products by priority, all six on "Show all 6", `GL-FIX-15` at **$286.70/mo, $51,605.21 total**, every
card carrying the inline disclosure, "Ask about this option" opening B's panel, and "Start application" carrying the
chosen scenario to `#/apply`.

Sources (read by the planner; quoted where load-bearing):
- `docs/plans/slice-plan.md` → *Segments* → *A · Quote and compare (no AI)*; *Collision map*.
- `docs/prd/goodleap-prd.md` §6 **R-1** ("returns scenarios for every catalog product, ranked by priority. Amount
  outside the catalog range ($5K–$100K) returns a clear error, not an empty list"), **R-2** (deterministic maths with
  unit tests; WP-1), **R-3** ("Every scenario card shows the inline disclosure: estimated, not an offer or credit
  decision; APR; term; total cost of credit"); §7 **C-2** (disclosures attached by code), **C-3** (numbers never come
  from the model; check 1 uses the computed scenario); §13 acceptance line 1 ("SCR-1 shows the top three products for
  $30,000 by priority, all six on 'Show all', with `GL-FIX-15` at $286.70/mo, $51,605.21 total").
- `docs/data/worked-pairs.md` **WP-1** (the test oracle; table copied into §6 below).
- `data/synthetic/catalog.json` (catalogVersion `2026-10-29`, amountRange 5000–100000, six products).
- `docs/ux/03-structure/SCREEN_SPECS.md` → *SCR-1 · Compare options*, *Phone layout*.
- `docs/ux/01-planning/USER_FLOWS.md` → state table row SCR-1: "empty (no amount) · loading · results · error: amount
  out of range · error: server | Inline message with the valid range; retry".
- `.claude/rules/brief-conformance.md` (no credit decision implied; disclosures; numbers from code).

## 2. Boundary

**Owned (the only files you create or edit):**

| File | Action |
|---|---|
| `apps/server/src/finance/index.ts` | modify (replace stub bodies; keep the three exported names and signatures exactly) |
| `apps/server/src/finance/errors.ts` | create |
| `apps/server/src/finance/amortize.ts` | create |
| `apps/server/src/finance/scenario.ts` | create |
| `apps/server/src/finance/rank.ts` | create |
| `apps/server/src/routes/quote.ts` | modify (replace the stub) |
| `apps/server/test/finance.test.ts` | create |
| `apps/web/src/screens/Compare.tsx` | modify (replace the stub; keep `export default function Compare()`) |
| `apps/web/src/screens/compare/useQuote.ts` | create |
| `apps/web/src/screens/compare/AmountPicker.tsx` | create |
| `apps/web/src/screens/compare/PriorityToggle.tsx` | create |
| `apps/web/src/screens/compare/OptionCard.tsx` | create |
| `apps/web/src/screens/compare/PhoneBar.tsx` | create |

Plus outputs (not source): `docs/artifacts/screens/scr-1-compare.png`, `scr-1-compare-390.png`,
`scr-1-compare-all.png`, `scr-1-compare-error.png`; the helper script
`/home/linuxuser/.claude/jobs/9d0cbc15/tmp/shot-scr1.ts` (outside the repo).

**Shared surfaces, read only (Foundation-owned; never edit):** `packages/shared/src/types.ts`,
`packages/shared/src/format.ts`, `apps/server/src/index.ts`, `apps/server/src/data.ts`,
`apps/web/src/components/ui.tsx`, `components/Disclosure.tsx`, `components/Summary.tsx`, `components/Shell.tsx`,
`state/session.ts`, `lib/api.ts`, `router.ts`, `App.tsx`, `screens/registry.ts`, `index.css`, `vitest.config.ts`,
`eslint.config.js`, all `package.json` / tsconfig files.

**Other segments own (do not touch, do not import their components):** B: `apps/server/src/{assist,guardrails,audit}/**`,
`routes/ask.ts`, `routes/audit.ts`, `components/AskAboutOption.tsx`, `screens/Audit.tsx`. C: `apps/server/src/{application,integrations}/**`,
`routes/application.ts`, `screens/{StartApplication,VerifyIncome,Review}.tsx`. D: `screens/Roadmap.tsx`, `data/synthetic/roadmap.json`.
A opens B's panel only through `session.set({ selected: scenario, askOpen: true })`; `App.tsx` renders it.

**Consumers of A's contract:** B and C import `quote`, `scenarioFor`, `FinanceError` from
`apps/server/src/finance/index.ts`. Keep these exact signatures (copied from the stub):

```ts
export function quote(amount: number, priority: Priority, catalog: Catalog): Scenario[];
export function scenarioFor(amount: number, product: Product): Scenario;   // rank 0: unranked
export class FinanceError extends Error {
  constructor(public code: "amount_below_min" | "amount_above_max" | "invalid_amount", message: string) { super(message); }
}
```

## 3. Requirements table

| # | Requirement (source) | Implementation | Verification |
|---|---|---|---|
| A1 | R-2 fixed amortization; WP-1 FIX rows | `amortize.ts` `paymentExact`; `scenario.ts` fixed branch (§5 step 3) | `finance.test.ts` › `WP-1 fixed products at $30,000` |
| A2 | R-2 0% intro product; WP-1 INTRO row | intro branch (§5 step 4) | › `WP-1 GL-INTRO-0 phases and totals` |
| A3 | R-2 deferred promo: payoff payment + retroactive interest; WP-1 DEF row | deferred branch (§5 step 5) | › `WP-1 GL-DEF-18 payoff and retroactive interest` |
| A4 | R-2 spot checks $15K/$45K FIX-15 | same fixed branch | › `WP-1 spot checks for GL-FIX-15 at $15,000 and $45,000` |
| A5 | R-1 ranked by priority, all six returned | `rank.ts` (§5 step 7) | › `ranks lower_monthly by highest regular payment, deferred last`, › `ranks lower_total by total paid, deferred last` |
| A6 | R-1 out-of-range → clear error, not empty list; WP-1 "$4,000 → below the $5,000 minimum" | `errors.ts` `checkQuoteAmount`; route maps `FinanceError` → 400 | › `rejects $4,000 with amount_below_min`, › `rejects $100,001 with amount_above_max`, › route tests |
| A7 | R-3 / C-2 disclosure on every scenario | `buildDisclosures` (§5 step 6); `<Disclosure d={s.disclosures} />` on every card | › `disclosures carry ESTIMATE_LINE, APR, term, cost of credit, total paid`; screenshot shows a disclosure block per card |
| A8 | C-3 allowed numbers for B's check | `buildAllowedNumbers` (§5 step 6) | › `allowedNumbers hold every number the model may say` |
| A9 | Scenario.id `${productId}@${amount}`, catalogVersion in response | `scenario.ts`; route | › `scenario ids and response envelope` (route test) |
| A10 | Route `POST /api/quote` → `QuoteResponse`; 400 `ApiError` codes; message names field + constraint, never echoes input | `routes/quote.ts` (§5 step 9) | route tests in `finance.test.ts`; `curl` in §7 |
| A11 | §13 acceptance: top 3 at $30K by priority, all six on Show all, FIX-15 $286.70 / $51,605.21 | `Compare.tsx` + `OptionCard.tsx` | Playwright script assertions + `scr-1-compare.png`, `scr-1-compare-all.png` |
| A12 | SCR-1 amount field + chips $15K/$30K/$45K | `AmountPicker.tsx` | Playwright clicks `$45K`, sees `$430.04` |
| A13 | SCR-1 priority segmented control | `PriorityToggle.tsx` (buttons with `aria-pressed`) | Playwright clicks "Lower total cost", first card is "Fixed 5-year" |
| A14 | Card content per spec incl. INTRO phases, promo condition in `--check` colour | `OptionCard.tsx` | screenshots; Playwright finds "$250.00 × 12, then $379.98 × 108" after Show all |
| A15 | Buttons **Ask about this option** (secondary), **Choose this option** (primary when selected) | `OptionCard.tsx` | Playwright: Ask opens `role=dialog`; Choose sets `aria-pressed=true` |
| A16 | Right: `FinancingSummary`; **Start application** disabled until chosen, helper text; → `go("apply")` | `Compare.tsx` `action` | Playwright: disabled before, enabled after choosing; click → URL hash `#/apply` |
| A17 | States: empty, loading skeletons, results, inline out-of-range error, server error with retry | `useQuote.ts` state machine + `Compare.tsx` | Playwright types 4000 → "below the $5,000 minimum" (`scr-1-compare-error.png`); empty field → empty-state notice; server error path: review by reading (no fault injection) |
| A18 | Copy: "estimated payment", never "your rate" / "you'll pay" | fixed strings in §5 | `grep -rniE "your rate\|you'll pay\|you will pay" apps/web/src/screens/Compare.tsx apps/web/src/screens/compare apps/server/src/finance` → no output; Playwright asserts 0 matches on page |
| A19 | Fetch on amount/priority change, debounced ~300 ms | `useQuote.ts` | read; Playwright chip click updates within 2 s |
| A20 | Works at 390 px; phone: summary as sticky bottom bar with chosen option + primary action | cards stack (`grid-cols-1`); `PhoneBar.tsx` fixed bar `lg:hidden` | `scr-1-compare-390.png` |
| A21 | Pure finance core, thin route (`code-design-solid-modularity`) | finance files import only `@goodleap/shared` types/`round2`/formatters; no `node:fs`, no Hono | `grep -nE "from \"(hono\|node:\|\.\./data)" apps/server/src/finance` → no output |

## 4. Shared code to use (copied from current code)

`@goodleap/shared` (`packages/shared/src/index.ts` re-exports `types.ts` and `format.ts`):

```ts
export type Priority = "lower_monthly" | "lower_total";
export type ProductKind = "fixed" | "intro" | "deferred";
export interface Product { id: string; name: string; kind: ProductKind; aprPct: number; termMonths: number;
  introMonths?: number; introAprPct?: number; promoMonths?: number; terms: string; }
export interface Catalog { synthetic: true; description: string; catalogVersion: string;
  amountRange: { min: number; max: number }; products: Product[]; }
export interface PaymentPhase { months: number; payment: number; label: string; }
export interface Disclosures { estimateLine: string; aprPct?: number; termMonths?: number;
  totalCostOfCredit?: number; totalPaid?: number; lines: string[]; }
export interface Scenario { id: string; productId: string; productName: string; kind: ProductKind; amount: number;
  aprPct: number; termMonths: number; monthlyPayment: number; phases: PaymentPhase[]; totalPaid: number;
  totalInterest: number; promo?: { months: number; payoffMonthly: number; retroactiveInterest: number; condition: string };
  note?: string; rank: number; disclosures: Disclosures; allowedNumbers: number[]; }
export interface QuoteRequest { amount: number; priority: Priority; }
export interface QuoteResponse { catalogVersion: string; amount: number; priority: Priority; scenarios: Scenario[]; }
export interface ApiError { error: { code: string; message: string } }

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const formatUsd = (n: number) => usd.format(n);     // "$1,234.56"
export const formatUsd0 = (n: number) => usd0.format(n);   // "$30,000"
export const formatPct = (n: number) => `${n.toFixed(2)}%`; // "24.99%"
export const ESTIMATE_LINE = "Estimated, not an offer of credit or a credit decision. The lender's credit review decides.";
export const RESPA_LINE = "Settlement costs: none are charged in this demo. ...";  // Disclosure adds it only when `full`
```

Server:
- `apps/server/src/data.ts`: `export function loadCatalog(): Catalog` (reads `data/synthetic/catalog.json`, cached).
- `apps/server/src/index.ts` mounts `app.route("/api", quoteRoutes)` (first of four) and has
  `app.onError` → 500 `{error:{code:"server_error",...}}`. Keep the export name `quoteRoutes`.
- Import style in the server: relative imports **with** `.ts` extension (`import { loadCatalog } from "../data.ts";`).
- Hono: `import { Hono } from "hono";` `c.req.json<T>()`, `c.json<T>(body, status)`; sub-app testing:
  `await quoteRoutes.request("/quote", { method: "POST", headers: { "content-type": "application/json" }, body })`.

Web (imports are extensionless in `apps/web`, matching `App.tsx`):
- `import { TaskLayout, Card, Button, Field, Notice, Skeleton, cx } from "../components/ui";` (from `screens/compare/*`
  use `../../components/ui`). Signatures:
  - `TaskLayout({ title, sub?, aside?, centre, right, rightTitle, action? })`
  - `Card({ children, className?, selected? })`
  - `Button` props: `variant?: "primary"|"secondary"|"quiet"|"link"|"danger"`, `size?: "sm"|"md"|"lg"`, `loading?`, plus button attrs.
  - `Field({ label, hint?, error?, id, className?, ...inputAttrs })`; error renders `<p id={id-err} role="alert">`.
  - `Notice({ tone?: "info"|"check"|"office"|"danger", children, icon?, className? })`
  - `Skeleton({ className? })`
- `import { Disclosure } from "../../components/Disclosure";` → `<Disclosure d={scenario.disclosures} />`.
- `import { FinancingSummary } from "../components/Summary";` → `<FinancingSummary s={s} />`.
- `import { session, useSession } from "../state/session";` keys used: `amount`, `priority`, `quote`, `selected`, `askOpen`.
- `import { api, ApiFailure } from "../lib/api";` → `api.post<QuoteResponse>("/quote", { amount, priority })`;
  throws `ApiFailure(status, code, message)`; network failure → `status 0`, `code "network"`.
- `import { go } from "../router";` → `go("apply")`.
- Tokens/classes available: `text-check`, `bg-checkbg`, `text-muted`, `text-accent`, `bg-accent`, `text-onaccent`,
  `bg-raised`, `bg-soft`, `border-line`, `bg-surface`, `text-danger`, class `num` (tabular figures).
- Icons: `lucide-react` (`AlertTriangle`, `Check`, `RotateCw`).

## 5. Steps

### Server: the pure finance core (`apps/server/src/finance/`)

Dependency direction: `routes/quote.ts` → `finance/index.ts` → `scenario.ts`, `rank.ts`, `errors.ts` → `amortize.ts`.
Finance files import only from `@goodleap/shared` and each other. No `node:*`, no `hono`, no `../data.ts`.

**Step 1. `errors.ts`.**
```ts
import { formatUsd0, round2, type Catalog } from "@goodleap/shared";
export class FinanceError extends Error {
  constructor(public code: "amount_below_min" | "amount_above_max" | "invalid_amount", message: string) { super(message); }
}
export function checkAmount(amount: number): void      // used by scenarioFor
export function checkQuoteAmount(amount: number, range: Catalog["amountRange"]): void  // used by quote
```
- `checkAmount`: if `typeof amount !== "number" || !Number.isFinite(amount) || round2(amount) !== amount` → throw
  `new FinanceError("invalid_amount", "Amount must be a number of dollars and cents, for example 30000.")`;
  if `amount <= 0` → throw `new FinanceError("invalid_amount", "Amount must be more than $0.")`.
- `checkQuoteAmount`: run the first check of `checkAmount` (finite, cents), then
  `amount < range.min` → `new FinanceError("amount_below_min", \`Amount is below the ${formatUsd0(range.min)} minimum.\`)`
  (→ "Amount is below the $5,000 minimum."); `amount > range.max` →
  `new FinanceError("amount_above_max", \`Amount is above the ${formatUsd0(range.max)} maximum.\`)`.
  Invariant: no message contains the submitted value (A10).

**Step 2. `amortize.ts`.**
```ts
/** Level monthly payment at full precision (not rounded). Monthly compounding: r = aprPct / 100 / 12. */
export function paymentExact(principal: number, aprPct: number, months: number): number
```
`r === 0 ? principal / months : principal * r / (1 - Math.pow(1 + r, -months))`.

**Rounding convention (named; this is how WP-1 was computed; checked by the planner in a scratch script):**
- A displayed payment is `round2(exact payment)`.
- A **total is computed from the exact (unrounded) payments and rounded once**: `totalPaid = round2(Σ phase exactPayment × months)`,
  `totalInterest = round2(totalPaid − amount)`.
- This is a deliberate correction to the dispatch's "totals = sum of the rounded payments". That convention does
  **not** reproduce WP-1. Measured: summing rounded payments with a cent-adjusted final payment gives FIX-15
  $51,604.45 and FIX-25 $78,570.80; `rounded payment × n` gives $51,606.00 and $78,570.00. Only
  `round2(exact × n)` gives $51,605.21 and $78,570.15, and it reproduces every WP-1 total (FIX-05 35,633.67, FIX-10
  42,713.85, INTRO 44,037.66). WP-1 is the test oracle, so it wins. Put a one-line comment above `paymentExact`
  stating this convention. (A real lender's schedule would differ by cents; the orchestrator lists it as a README
  simplifying assumption, see §8.)

**Step 3. `scenario.ts`, fixed branch** (`kind === "fixed"`).
```ts
export function buildScenario(amount: number, product: Product): Scenario   // rank 0, no relative note
```
1. `exact = paymentExact(amount, product.aprPct, product.termMonths)`; `payment = round2(exact)`.
2. `phases = [{ months: product.termMonths, payment, label: \`${product.termMonths} monthly payments\` }]`.
3. `totalPaid = round2(exact * product.termMonths)`; `totalInterest = round2(totalPaid - amount)`.
4. `monthlyPayment = payment`; `note` undefined; `promo` undefined.

**Step 4. intro branch** (`kind === "intro"`; GL-INTRO-0).
1. `introN = product.introMonths!` (12), `introApr = product.introAprPct ?? 0`. If `introApr !== 0` or `introN` missing,
   throw a plain `Error("finance: intro products with a non-zero intro APR are not supported")` (catalog guard, not a
   user error).
2. `introExact = amount / product.termMonths` (principal only, per catalog terms "loan amount divided by 120") → 250.
3. `remaining = amount - introExact * introN` (27,000 at $30K; keep exact).
4. `laterN = product.termMonths - introN` (108); `laterExact = paymentExact(remaining, product.aprPct, laterN)` → 379.978…
5. `phases = [{ months: introN, payment: round2(introExact), label: \`Months 1–${introN}: 0% intro, principal only\` },
   { months: laterN, payment: round2(laterExact), label: \`Months ${introN + 1}–${product.termMonths} at ${formatPct(product.aprPct)} APR\` }]`.
6. `totalPaid = round2(introExact * introN + laterExact * laterN)` → 44,037.66; `totalInterest` → 14,037.66.
7. `monthlyPayment = phases[0].payment` (250.00, the type's "first phase's payment").
8. `note = \`Payment rises after month ${introN}\`` → "Payment rises after month 12".
9. `aprPct = product.aprPct` (9.99), `termMonths = product.termMonths` (120).

**Step 5. deferred branch** (`kind === "deferred"`; GL-DEF-18).
1. `promoN = product.promoMonths!` (18); `payoffExact = amount / promoN`; `payoff = round2(payoffExact)` → 1,666.67.
2. `phases = [{ months: promoN, payment: payoff, label: \`Months 1–${promoN}: pays it off within the promo\` }]`.
3. `totalPaid = round2(payoffExact * promoN)` → 30,000 ("if cleared"); `totalInterest = round2(totalPaid - amount)` → 0.
4. `retroactiveInterest = round2(amount * (product.aprPct / 100) * (promoN / 12))` → 11,245.50 (simple interest).
5. `promo = { months: promoN, payoffMonthly: payoff, retroactiveInterest, condition }` where
   `condition = \`No interest if the full balance is paid within ${promoN} months. If any balance remains after month ${promoN}, interest at ${formatPct(product.aprPct)} APR is charged from the start on the full ${formatUsd0(amount)}: about ${formatUsd(retroactiveInterest)}.\``
   (at $30K: "…on the full $30,000: about $11,245.50.").
6. `monthlyPayment = payoff`; `note = \`Only cheaper if paid off within ${promoN} months\``.
7. `aprPct = product.aprPct` (24.99), `termMonths = product.termMonths` (84).

**Step 6. common fields, disclosures, allowed numbers** (all in `scenario.ts`).
- `id = \`${product.id}@${amount}\``, `productId`, `productName = product.name`, `kind`, `amount`, `rank: 0`.
- `buildDisclosures(...)` returns
  `{ estimateLine: ESTIMATE_LINE, aprPct, termMonths, totalCostOfCredit: totalInterest, totalPaid, lines }` where
  `lines` is: fixed → `[]`; intro → `[INTRO_LINE]` with
  `INTRO_LINE = \`0% APR for the first ${introN} months (principal-only payments), then ${formatPct(apr)} APR on the remaining balance for ${laterN} months. This is not deferred interest: no interest is charged retroactively.\``;
  deferred → `[promo.condition]`.
- `buildAllowedNumbers(...)`: collect, then `[...new Set(list.map(round2))]` (order of first appearance kept).
  Every scenario: `amount`, each phase's `payment` and `months`, `totalPaid`, `totalInterest`, `aprPct`,
  `termMonths`, and `termMonths / 12` when it is a whole number.
  Intro adds: `introN` (12), `introApr` (0), `introN + 1` (13, "from month 13"), `round2(remaining)` (27,000).
  Deferred adds: `promoN` (18), `payoff` (dup-removed), `retroactiveInterest` (11,245.50).
  Invariant: every number that appears in the card, the disclosure or `promo.condition` is in the list (B's check
  passes code-written text).

**Step 7. `rank.ts`.**
```ts
export function regularPayment(s: Scenario): number   // Math.max(...s.phases.map((p) => p.payment))
export function rankScenarios(scenarios: Scenario[], priority: Priority): Scenario[]  // returns new objects, rank 1..n
export function addRelativeNotes(scenarios: Scenario[]): Scenario[]
```
`rankScenarios`:
1. Input is in catalog order. Split into `ranked = kind !== "deferred"` and `last = kind === "deferred"`.
2. Sort `ranked` (copy; `Array.prototype.sort` is stable, so catalog order breaks ties) ascending by
   `lower_monthly → regularPayment(s)`; `lower_total → s.totalPaid`.
3. Concatenate `[...ranked, ...last]` and map to `{ ...s, rank: i + 1 }`.
- Invariant (compliance choice): a 0% intro product is ranked by its **highest scheduled regular payment** (379.98),
  never by its teaser 250.00; the deferred product is always last because its cost depends on behaviour.
- **Deviation from WP-1's table order (recorded choice, from the dispatch):** WP-1 lists lower-monthly as FIX-25,
  FIX-15, INTRO-0, FIX-10, FIX-05, DEF-18. With this rule it is **FIX-25, FIX-15, FIX-10, INTRO-0, FIX-05, DEF-18**
  (FIX-10's 355.95 < INTRO-0's 379.98). Lower-total matches WP-1: FIX-05, FIX-10, INTRO-0, FIX-15, FIX-25, DEF-18.
  The §13 acceptance (FIX-15 in the top three at $30K) still holds. Add a comment in `rank.ts` saying this.

`addRelativeNotes` (independent of priority; skips any scenario that already has a `note`; deferred excluded from
the comparison):
1. Among non-deferred, `lowestMonthly` = min `regularPayment`, `highestInterest` = max `totalInterest`,
   `lowestInterest` = min `totalInterest` (first in catalog order on ties).
2. If `lowestMonthly === highestInterest`: its note = "Lowest monthly payment, highest total interest";
   else `lowestMonthly` note = "Lowest monthly payment".
3. `lowestInterest` note = "Lowest total interest" (if it has no note yet).
At $30K: FIX-25 "Lowest monthly payment, highest total interest"; FIX-05 "Lowest total interest"; INTRO and DEF keep
their own notes; FIX-10 and FIX-15 none.

**Step 8. `index.ts`** (replace the stub; keep the file's header comment updated to "Segment A").
```ts
import type { Catalog, Priority, Product, Scenario } from "@goodleap/shared";
import { checkAmount, checkQuoteAmount } from "./errors.ts";
import { buildScenario } from "./scenario.ts";
import { addRelativeNotes, rankScenarios } from "./rank.ts";
export { FinanceError } from "./errors.ts";

export function quote(amount: number, priority: Priority, catalog: Catalog): Scenario[] {
  checkQuoteAmount(amount, catalog.amountRange);
  return rankScenarios(addRelativeNotes(catalog.products.map((p) => buildScenario(amount, p))), priority);
}
export function scenarioFor(amount: number, product: Product): Scenario {
  checkAmount(amount);
  return buildScenario(amount, product);
}
```
`buildScenario` throws `Error("finance: unknown product kind")` for an unknown `kind` (exhaustive `switch`).
`quote` does not validate `priority`; the route does (B/C pass typed values).

### Server: the route

**Step 9. `apps/server/src/routes/quote.ts`.** Remove the stub's `quoteRoutes.all("*", …)` entirely (it currently
catches every `/api/*` path, because `quoteRoutes` is mounted first). Define only `POST /quote`:
1. `const body = await c.req.json<Record<string, unknown>>().catch(() => ({} as Record<string, unknown>));`
   (a non-object or bad JSON body is treated as `{}`).
2. `amount = body.amount`: if `typeof amount !== "number" || !Number.isFinite(amount)` → 400
   `{ error: { code: "invalid_amount", message: "Amount must be a number of dollars, for example 30000." } }`.
3. `priority = body.priority`: if not `"lower_monthly"` or `"lower_total"` → 400
   `{ error: { code: "invalid_priority", message: "Priority must be \"lower_monthly\" or \"lower_total\"." } }`.
4. `const catalog = loadCatalog();` then `try { scenarios = quote(amount, priority, catalog) } catch (e) {
   if (e instanceof FinanceError) return c.json<ApiError>({ error: { code: e.code, message: e.message } }, 400); throw e; }`
   (other errors reach `app.onError` → 500).
5. Return `c.json<QuoteResponse>({ catalogVersion: catalog.catalogVersion, amount, priority, scenarios })` (200).
Order of checks: amount type → priority → range (so `{amount: 4000, priority: "x"}` → `invalid_priority`; tests use
valid priorities with bad amounts). Never interpolate `body` values into a message.

### Tests

**Step 10. `apps/server/test/finance.test.ts`** (one file, the size is small). Imports:
```ts
import { describe, expect, it } from "vitest";
import { ESTIMATE_LINE, type Scenario } from "@goodleap/shared";
import { loadCatalog } from "../src/data.ts";
import { FinanceError, quote, scenarioFor } from "../src/finance/index.ts";
import { quoteRoutes } from "../src/routes/quote.ts";
```
Helper: `const byId = (list: Scenario[], id: string) => list.find((s) => s.productId === id)!;`
`const post = (body: unknown) => quoteRoutes.request("/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });`

`describe("WP-1 quote maths at $30,000")`:
- `it("WP-1 fixed products at $30,000")`: from `quote(30000, "lower_monthly", loadCatalog())`, assert for each of
  GL-FIX-05/10/15/25 `monthlyPayment`, `totalPaid`, `totalInterest`, `phases` length 1 with `months` = term, using
  `toBe` on the exact values in §6.
- `it("WP-1 GL-INTRO-0 phases and totals")`: `phases` equal
  `[{months:12,payment:250}, {months:108,payment:379.98}]` (use `toMatchObject` so labels are not pinned),
  `monthlyPayment 250`, `totalPaid 44037.66`, `totalInterest 14037.66`, `note "Payment rises after month 12"`,
  `aprPct 9.99`, `termMonths 120`.
- `it("WP-1 GL-DEF-18 payoff and retroactive interest")`: `monthlyPayment 1666.67`, `phases[0]` `{months:18,payment:1666.67}`,
  `totalPaid 30000`, `totalInterest 0`, `promo` `{months:18,payoffMonthly:1666.67,retroactiveInterest:11245.5}`,
  `promo.condition` contains "$11,245.50", `note "Only cheaper if paid off within 18 months"`, `aprPct 24.99`, `termMonths 84`.
- `it("returns all six catalog products")`: length 6; set of `productId` equals the catalog's ids.

`describe("ranking")`:
- `it("ranks lower_monthly by highest regular payment, deferred last")`: ids in order
  `["GL-FIX-25","GL-FIX-15","GL-FIX-10","GL-INTRO-0","GL-FIX-05","GL-DEF-18"]`; `rank` values `[1..6]`.
- `it("ranks lower_total by total paid, deferred last")`: `["GL-FIX-05","GL-FIX-10","GL-INTRO-0","GL-FIX-15","GL-FIX-25","GL-DEF-18"]`.
- `it("adds relative notes")`: FIX-25 note "Lowest monthly payment, highest total interest"; FIX-05 "Lowest total interest";
  FIX-10 and FIX-15 `note` undefined.

`describe("spot checks and validation")`:
- `it("WP-1 spot checks for GL-FIX-15 at $15,000 and $45,000")`: `byId(quote(15000,…),"GL-FIX-15").monthlyPayment` `toBe(143.35)`; $45,000 → `430.04`.
- `it("rejects $4,000 with amount_below_min")`: `expect(() => quote(4000, "lower_monthly", cat)).toThrow(FinanceError)`;
  catch it and assert `code === "amount_below_min"` and `message` contains "below the $5,000 minimum" and does not contain "4000" / "4,000".
- `it("rejects $100,001 with amount_above_max")`.
- `it("rejects NaN and fractions of a cent with invalid_amount")`: `quote(NaN,…)` and `quote(30000.001,…)` → code `invalid_amount`.
- `it("scenarioFor returns an unranked scenario")`: `scenarioFor(30000, fix15)` → `rank 0`, `id "GL-FIX-15@30000"`, `monthlyPayment 286.7`.

`describe("disclosures and allowed numbers")`:
- `it("disclosures carry ESTIMATE_LINE, APR, term, cost of credit, total paid")`: FIX-15 `disclosures` `toEqual`
  `{ estimateLine: ESTIMATE_LINE, aprPct: 8, termMonths: 180, totalCostOfCredit: 21605.21, totalPaid: 51605.21, lines: [] }`;
  every one of the six has `estimateLine === ESTIMATE_LINE`; INTRO `lines[0]` contains "not deferred interest";
  DEF `lines[0]` equals `promo.condition`.
- `it("allowedNumbers hold every number the model may say")`: `expect(fix15.allowedNumbers).toEqual(expect.arrayContaining([30000, 286.7, 180, 51605.21, 21605.21, 8, 15]))`;
  INTRO contains `[250, 12, 379.98, 108, 120, 10, 9.99, 0, 13, 27000, 44037.66, 14037.66]`;
  DEF contains `[30000, 1666.67, 18, 24.99, 84, 7, 11245.5, 0]`; every value `Number.isFinite`; no duplicates
  (`new Set(a).size === a.length`).

`describe("POST /quote route")`:
- `it("returns a ranked QuoteResponse for $30,000")`: status 200; `catalogVersion "2026-10-29"`, `amount 30000`,
  `priority "lower_monthly"`, 6 scenarios, `scenarios[1].productId "GL-FIX-15"`, FIX-15 `monthlyPayment 286.7`, `totalPaid 51605.21`,
  `scenarios[0].id "GL-FIX-25@30000"`.
- `it("returns 400 amount_below_min for $4,000")`: status 400; `error.code "amount_below_min"`; `error.message` contains "below the $5,000 minimum".
- `it("returns 400 invalid_amount for a string amount")`: body `{ amount: "30000", priority: "lower_monthly" }` → 400 `invalid_amount`.
- `it("returns 400 invalid_priority")`: body `{ amount: 30000, priority: "cheapest" }` → 400 `invalid_priority`; message does not contain "cheapest".
- `it("returns 400 invalid_amount for malformed JSON")`: `quoteRoutes.request("/quote", { method: "POST", headers: {"content-type":"application/json"}, body: "{" })` → 400 `invalid_amount`.

Run: `npx vitest run apps/server/test/finance.test.ts` (repo root). All green before any web work is reported done.

### Web: SCR-1

**Step 11. `screens/compare/useQuote.ts`.**
```ts
export type QuoteStatus = "empty" | "loading" | "ready" | "amount_error" | "server_error";
export function useQuote(amount: number | null, priority: Priority): { status: QuoteStatus; error: string | null; retry: () => void }
```
1. `amount === null` → status `"empty"`, no request.
2. If `session.get().quote` has the same `amount` and `priority`, status `"ready"`, no request (reload/back-nav keeps results).
3. Otherwise set `"loading"`, start a `setTimeout(…, 300)`; clear it in the effect cleanup (debounce).
4. On fire: increment a `useRef` request counter; `await api.post<QuoteResponse>("/quote", { amount, priority })`.
   Ignore the result if the counter moved on (stale response).
5. Success: `session.set((s) => ({ amount, priority, quote: res, selected: s.selected ? res.scenarios.find((x) => x.productId === s.selected!.productId) ?? null : null }))`
   (keeps the chosen product across amount/priority changes, re-priced); status `"ready"`.
6. `ApiFailure` with `status === 400` and `code` in `amount_below_min | amount_above_max | invalid_amount` → status
   `"amount_error"`, `error = e.message`, and `session.set({ quote: null, selected: null })`.
7. Anything else → `"server_error"`, `error = e.message` (keep the last `quote` on screen).
8. `retry()` bumps a `useState` nonce that is in the effect's dependency list.
Effect deps: `[amount, priority, nonce]`. Satisfy `react-hooks/exhaustive-deps` without disabling it.

**Step 12. `screens/compare/AmountPicker.tsx`.**
```tsx
export function AmountPicker({ text, onText, error }: { text: string; onText: (t: string) => void; error?: string })
export function parseAmount(text: string): number | null   // strips "$", ",", spaces; "" → null; non-number → NaN
```
- `<Field id="amount" label="Project amount" hint="The amount to finance, $5,000 to $100,000." inputMode="decimal" autoComplete="off" value={text} onChange={(e) => onText(e.target.value)} error={error} />`.
- Chips under it: `<div role="group" aria-label="Quick amounts">` with three `<Button size="sm" variant="secondary" aria-pressed={parseAmount(text) === v}>` labelled `$15K`, `$30K`, `$45K` setting text to `"15,000"`, `"30,000"`, `"45,000"`; the pressed chip gets `className="border-accent text-accent"`.
- In `Compare.tsx`: `parsed = parseAmount(text)`; if `Number.isNaN(parsed)` show the local error
  "Enter the amount as a number, for example 30,000." and pass `null` to `useQuote`; otherwise pass `parsed`. Range
  errors come from the server (`useQuote` `"amount_error"`), shown through the same `error` prop. Initial text:
  `session.get().amount.toLocaleString("en-US")`.

**Step 13. `screens/compare/PriorityToggle.tsx`.**
```tsx
export function PriorityToggle({ value, onChange }: { value: Priority; onChange: (p: Priority) => void })
```
`<div role="group" aria-label="What matters more" className="inline-flex rounded-xl border border-line bg-raised p-1">`
with two `<button type="button" aria-pressed={value === p}>`: "Lower monthly payment" (`lower_monthly`), "Lower total cost"
(`lower_total`). Pressed: `bg-accent text-onaccent`; unpressed: `text-text hover:bg-surface`; both `h-9 rounded-lg px-3 text-[13.5px] font-bold`.
On change: `session.set({ priority: p })`; `Compare.tsx` reads `s.priority` and passes it to `useQuote`.

**Step 14. `screens/compare/OptionCard.tsx`.**
```tsx
export function OptionCard({ s, selected, onAsk, onChoose }: { s: Scenario; selected: boolean; onAsk: () => void; onChoose: () => void })
export function OptionCardSkeleton()
```
Inside `<Card selected={selected} className="flex flex-col gap-3">`, root element wrapped as
`<article data-scenario={s.productId} aria-labelledby={\`opt-${s.productId}\`}>` (Card inside or around; one of them):
1. `<h3 id={\`opt-${s.productId}\`} className="text-[15px] font-extrabold">{s.productName}</h3>`.
2. Payment: `<p className="m-0 text-[12px] font-bold uppercase tracking-wide text-muted">Estimated payment</p>`
   `<p className="num m-0 text-[28px] font-extrabold leading-none">{formatUsd(s.monthlyPayment)}<span className="text-[14px] font-bold text-muted">/mo</span></p>`.
3. Term line (`num text-[13px] text-muted`): fixed → `for ${s.termMonths} months`; intro →
   `s.phases.map((p) => \`${formatUsd(p.payment)} × ${p.months}\`).join(", then ")` (→ "$250.00 × 12, then $379.98 × 108");
   deferred → `for ${s.phases[0].months} months to pay it off in the promo`.
4. `<dl className="num grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">` rows: **APR** → fixed/deferred `formatPct(s.aprPct)`, intro
   `0.00% for ${s.phases[0].months} months, then ${formatPct(s.aprPct)}`; **Total paid** → `formatUsd(s.totalPaid)`
   (deferred: `${formatUsd(s.totalPaid)} if cleared`); **Total interest** → `formatUsd(s.totalInterest)` (deferred: `$0.00 if cleared`).
5. Note: `kind !== "fixed" && s.note` → `<p className="m-0 flex items-start gap-1.5 rounded-lg bg-checkbg px-2.5 py-1.5 text-[12.5px] font-bold text-check"><AlertTriangle aria-hidden className="mt-0.5 size-3.5 flex-none" />{s.note}</p>`;
   deferred additionally a second line in the same style: `If not paid off in ${s.promo.months} months: about ${formatUsd(s.promo.retroactiveInterest)} interest added.`;
   fixed with a note → `<p className="m-0 text-[12.5px] font-semibold text-muted">{s.note}</p>`.
6. `<Disclosure d={s.disclosures} />` (always; never conditional).
7. Buttons row `mt-auto flex flex-wrap gap-2`: `<Button variant="secondary" size="sm" onClick={onAsk}>Ask about this option</Button>`
   and `<Button variant={selected ? "primary" : "secondary"} size="sm" aria-pressed={selected} onClick={onChoose}>{selected && <Check aria-hidden className="size-4" />}Choose this option</Button>`
   (label never changes; state is `aria-pressed` + variant + Card ring).
`OptionCardSkeleton`: `<Card><Skeleton className="h-5 w-32" /><Skeleton className="mt-3 h-8 w-24" /><Skeleton className="mt-3 h-24" /><Skeleton className="mt-3 h-16" /></Card>`.

**Step 15. `screens/compare/PhoneBar.tsx`** (SCREEN_SPECS *Phone layout*; `TaskLayout` has no phone bar, see §8).
```tsx
export function PhoneBar({ s }: { s: SessionState })   // import type { SessionState } from "../../state/session"
```
`<div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-line bg-surface px-4 py-3 lg:hidden">`:
left `min-w-0 flex-1`: chosen name (`truncate font-bold text-[13.5px]`) or "No option chosen yet", and below it
`num text-[12.5px] text-muted` `Estimated ${formatUsd(s.selected.monthlyPayment)}/mo`; right
`<Button variant="primary" disabled={!s.selected} onClick={() => go("apply")}>Start application</Button>`.
z-20 sits under `.slideover` (z-index 50). In `Compare.tsx` add `<div aria-hidden className="h-20 lg:hidden" />` at the end
of the centre so the last card is not hidden behind the bar.

**Step 16. `screens/Compare.tsx`.**
```tsx
export default function Compare() {
  const s = useSession();
  const [text, setText] = useState(() => session.get().amount.toLocaleString("en-US"));
  const [showAll, setShowAll] = useState(false);
  ...
}
```
- `TaskLayout` props: `title="Compare options"`, `sub="Estimated payments for each loan option. Not an offer of credit."`,
  `rightTitle="Financing summary"`, `right={<FinancingSummary s={s} />}`,
  `action={<><Button variant="primary" size="lg" disabled={!s.selected} aria-describedby="start-help" onClick={() => go("apply")}>Start application</Button><p id="start-help" className="m-0 text-[12.5px] text-muted">{s.selected ? \`Carries the ${s.selected.productName} estimate into the application.\` : "Choose an option to start the application."}</p></>}`.
- Centre, in order: `AmountPicker`; `PriorityToggle`; status area; cards; Show-all toggle; phone spacer; `PhoneBar`.
- Status rendering:
  - `"empty"` → `<Notice>Enter the project amount to see estimated payments.</Notice>`, no cards.
  - `"loading"` with no `s.quote` → three `OptionCardSkeleton`; with an old quote → the old cards in a wrapper with
    `aria-busy="true" className="opacity-60"`.
  - `"amount_error"` → error under the amount field only (Field `error`), no cards.
  - `"server_error"` → `<Notice tone="danger" icon={<AlertTriangle aria-hidden className="size-4" />}>` text
    `Couldn't load the estimates. {error}` plus `<Button size="sm" onClick={retry}><RotateCw aria-hidden className="size-4" />Try again</Button>`;
    keep any previous cards below it.
  - `"ready"` → cards.
- Cards: `const list = [...(s.quote?.scenarios ?? [])].sort((a, b) => a.rank - b.rank); const shown = showAll ? list : list.slice(0, 3);`
  grid `grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3` (3 across at 1440, 2×3 when all six show, stacked at 390).
  `onChoose={() => session.set({ selected: sc })}`; `onAsk={() => session.set({ selected: sc, askOpen: true })}`;
  `selected={s.selected?.id === sc.id}`.
- Show-all: `<Button variant="link" size="sm" aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>{showAll ? "Show top 3" : \`Show all ${list.length}\`}</Button>` (renders "Show all 6"),
  only when `list.length > 3`. Above the grid, a one-line muted caption:
  `s.priority === "lower_monthly" ? "Ranked by the highest regular monthly payment. The deferred-interest option is listed last because its cost depends on paying it off in time." : "Ranked by estimated total paid. The deferred-interest option is listed last because its cost depends on paying it off in time."`.
- Copy rule: the words "your rate", "you'll pay", "you will pay", "qualify", "approved" appear nowhere in A's files.

### Verification

**Step 17.** Run the checks in §7 in order. Write `/home/linuxuser/.claude/jobs/9d0cbc15/tmp/shot-scr1.ts` (outside the
repo; it must load Playwright from the repo with `createRequire`, because Node resolves bare imports from the script's
own folder):
```ts
import { createRequire } from "node:module";
const require = createRequire("/home/linuxuser/workspaces/inno-goodleap/package.json");
const { chromium } = require("playwright") as typeof import("playwright");
const OUT = "/home/linuxuser/workspaces/inno-goodleap/docs/artifacts/screens";
const URL = "http://127.0.0.1:5173/#/compare";
```
Desktop page (`viewport { width: 1440, height: 900 }`, new context):
1. `goto(URL)`; wait for `[data-scenario="GL-FIX-15"]` (timeout 15 s); assert `locator("[data-scenario]")` count is 3;
   FIX-15 card text contains "$286.70" and "$51,605.21"; first card is `GL-FIX-25`.
2. Assert the **Start application** button (`getByRole("button", { name: "Start application" }).first()`) is disabled.
3. Click FIX-15's "Choose this option"; assert it has `aria-pressed="true"` and Start application is enabled.
   Screenshot `scr-1-compare.png`.
4. Click "Show all 6"; assert 6 cards; assert the page contains "$250.00 × 12, then $379.98 × 108" and
   "Only cheaper if paid off within 18 months". Screenshot `scr-1-compare-all.png`.
5. Click "Lower total cost"; wait until the first `[data-scenario]` is `GL-FIX-05`.
6. Click `$45K`; wait for FIX-15 card text "$430.04".
7. Click FIX-15's "Ask about this option"; assert `getByRole("dialog")` is visible; press Escape.
8. Fill the amount field (`getByLabel("Project amount")`) with `4000`; wait for text "below the $5,000 minimum".
   Screenshot `scr-1-compare-error.png`.
9. Assert `page.getByText(/your rate|you'll pay/i)` count is 0.
10. Fill `30000` again, choose FIX-15, click Start application; assert `page.url()` ends with `#/apply`.
Phone page (`viewport { width: 390, height: 844 }`, new context): `goto(URL)`, wait for 3 cards, choose FIX-15, screenshot
`scr-1-compare-390.png` with `fullPage: true`. Then `browser.close()`. Any failed assertion throws and exits non-zero.
Run: `cd /home/linuxuser/workspaces/inno-goodleap && npx tsx /home/linuxuser/.claude/jobs/9d0cbc15/tmp/shot-scr1.ts`.
Look at each PNG (Read tool) and check: three cards side by side at 1440, disclosure block on each, warning-colour
notes, summary filled on the right; at 390 cards stacked and the bottom bar visible.

**Must not:**
- edit any file outside §2's owned list (if you think you need to, stop and write it under *Requests* in your report);
- import B's `AskAboutOption` or touch `App.tsx`; start, stop or restart servers on 8787/5173; run `npm run dev`;
- run the full suite (`npm test`) or other segments' tests; commit, push or create branches;
- compute any money figure in the web app (it only formats `Scenario` fields), or put an LLM anywhere in A;
- change the three finance export signatures, the `quoteRoutes` export name, or `Compare`'s default export;
- add dependencies; disable lint rules inline; delete or weaken a named test because it fails (fix the code, or report).

## 6. Data and fixtures

Synthetic only: `data/synthetic/catalog.json` (`"synthetic": true`, catalogVersion `2026-10-29`), loaded through
`loadCatalog()`; tests read the real fixture, no copies. Expected values (WP-1, re-derived by the planner with the
§5 step 2 convention; every one matched):

| Product | APR / term | monthlyPayment | phases | totalPaid | totalInterest |
|---|---|---|---|---|---|
| GL-FIX-05 | 6.99 / 60 | 593.89 | 60 × 593.89 | 35633.67 | 5633.67 |
| GL-FIX-10 | 7.49 / 120 | 355.95 | 120 × 355.95 | 42713.85 | 12713.85 |
| GL-FIX-15 | 8.00 / 180 | 286.70 | 180 × 286.70 | 51605.21 | 21605.21 |
| GL-FIX-25 | 9.49 / 300 | 261.90 | 300 × 261.90 | 78570.15 | 48570.15 |
| GL-INTRO-0 | 0 for 12, then 9.99 / 120 | 250.00 | 12 × 250.00, 108 × 379.98 | 44037.66 | 14037.66 |
| GL-DEF-18 | 24.99 / 84, promo 18 | 1666.67 | 18 × 1666.67 | 30000 (if cleared) | 0; retroactive 11245.50 |

Spot checks: FIX-15 at 15000 → 143.35; at 45000 → 430.04. Amount 4000 → `amount_below_min`.
Scratch derivation: `/home/linuxuser/.claude/jobs/9d0cbc15/tmp/amort.mjs` (planner's, not part of the build).

## 7. Checks

While iterating (repo root `/home/linuxuser/workspaces/inno-goodleap`):
1. `npx vitest run apps/server/test/finance.test.ts` → all tests in §5 step 10 pass (≈24 tests, 0 failed, 0 skipped).
2. `curl -s -X POST 127.0.0.1:8787/api/quote -H 'content-type: application/json' -d '{"amount":30000,"priority":"lower_monthly"}'`
   → JSON with `"catalogVersion":"2026-10-29"`, six scenarios, first `"productId":"GL-FIX-25"`, FIX-15 `"monthlyPayment":286.7`.
   Also `-d '{"amount":4000,"priority":"lower_monthly"}' -w '\n%{http_code}\n'` → `amount_below_min` and `400`.
   And `curl -s 127.0.0.1:8787/api/health` still returns `{"ok":true,...}` (the old catch-all is gone; ask/audit stubs answer 501, not A's message).
   If `tsx watch` did not reload, report it; do not restart it yourself.

Once before reporting (fast gates, cheapest first, stop at the first red):
3. `npx eslint apps/server/src/finance apps/server/src/routes/quote.ts apps/web/src/screens/Compare.tsx apps/web/src/screens/compare apps/server/test/finance.test.ts` → no output.
4. `npm run typecheck` → exit 0 (it checks all packages; a red caused by another segment's in-flight file is reported with the file name, not fixed).
5. `npx vitest run apps/server/test/finance.test.ts` → green.
6. The two `grep` checks in §3 rows A18 and A21 → no output.
7. `npx tsx /home/linuxuser/.claude/jobs/9d0cbc15/tmp/shot-scr1.ts` → exits 0 and writes the four PNGs to `docs/artifacts/screens/`.
No full suite: nothing A changes reaches everything (no shared fixture, config or dependency). Report each command with
its result, the test count, and the PNG paths.

## 8. Risks and requests

**Requests to orchestrator (none block the build):**
1. **Rounding convention correction.** The dispatch said "totals = sum of the rounded payments". That does not reproduce
   WP-1 (FIX-15 would be $51,604.45 or $51,606.00). The plan uses *round each displayed payment; compute totals from
   exact payments and round once*, which reproduces all WP-1 figures. Please add it to the README's simplifying
   assumptions ("totals are computed at full precision; a lender's cent-rounded schedule can differ by a few cents").
2. **Ranking deviation from WP-1's table.** Lower-monthly ranks FIX-10 above INTRO-0 (highest regular payment rule).
   WP-1's prose/table should be updated to the decided order, or the design doc should name the choice. Owner: docs.
3. **Phone summary bar.** `TaskLayout` has no phone-layout slot, so A renders its own fixed `PhoneBar` (`lg:hidden`)
   and the aside's Start application also stays in the flow at 390 px (two buttons with the same name on phone). A
   `phoneBar` prop on `TaskLayout` (Foundation) would remove the duplicate; C's screens may want the same.
4. **Amount range in the UI hint** is hard-coded ("$5,000 to $100,000") because `QuoteResponse` does not carry
   `amountRange`. Optional Foundation change: add `amountRange` to `QuoteResponse` in `types.ts`.
5. **For B:** `allowedNumbers` include `0`, month counts (12, 13, 18, 108, …), whole-year terms (5, 10, 15, 25, 7) and the
   intro remaining balance (27,000). B's number check should use them as listed; ask A's owner before adding derived figures.
6. **Ask sets `selected`.** "Ask about this option" sets `session.selected` (as `App.tsx` requires), so it also enables
   Start application. This follows the session comment ("the option chosen on SCR-1 (or the one being asked about)").

**Collisions:** none on files. The only behavioural seam is removing the stub's `quoteRoutes.all("*")`, which today
shadows every `/api/*` route; removing it unblocks B and C's stubs (expected, Foundation's intent).

**Open items (classed):**
- `RUNTIME`: whether `tsx watch` and Vite reload the new files. Expected: yes. If the curl still returns `not_built`,
  report it to the orchestrator; never restart the servers.
- `RUNTIME`: whether Playwright 1.64.1 launches its cached Chromium (`~/.cache/ms-playwright/chromium-1248` exists).
  If launch fails, report the error text; still deliver steps 1–6 of §7.
- `RUNTIME`: `npm run typecheck` covers other segments' in-progress files; a red outside A's files is reported, not fixed.
- `FREEDOM`: exact Tailwind spacing inside cards beyond the classes given; keep the tokens named in §4.

## 9. Readiness

**READY.** Every interface A consumes exists on disk now (`types.ts`, `format.ts`, `data.ts`, `ui.tsx`,
`Disclosure.tsx`, `Summary.tsx`, `session.ts`, `api.ts`, `router.ts`, `App.tsx` slot), checked by reading the files on
2026-10-29. WP-1 figures were re-derived and all match under the named convention. No product decision is open: the
two deviations (rounding convention, ranking order) are recorded choices from the dispatch and the WP-1 oracle.
