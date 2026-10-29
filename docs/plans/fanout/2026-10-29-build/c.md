# Segment C · Application prep, income verification, review and submit — index and shared contract

Planner: fanout-planner (Opus 5.5), 2026-10-29 ~02:00 CT. Direct planning (no context pack).

**Split.** Segment C is too large for one Sonnet implementer inside ~90 minutes (≈1,100 lines server + 31 tests,
≈800 lines web). It is split into two plans that can run **in parallel**:

| Plan | Owns | Readiness |
|---|---|---|
| [`c1-server.md`](c1-server.md) | `apps/server/src/application/**`, `apps/server/src/integrations/**`, `apps/server/src/routes/application.ts`, `apps/server/test/application.test.ts` | READY |
| [`c2-web.md`](c2-web.md) | `apps/web/src/screens/StartApplication.tsx`, `VerifyIncome.tsx`, `Review.tsx`, `apps/web/src/screens/application/**`, scratch `var/c2-screens.mjs` (not committed) | READY (live check and screenshots wait on c1's routes and segment A's `/api/quote`; see c2 *Checks*) |

c2 builds against the contract below and `packages/shared/src/types.ts`; it needs c1 only for the live click-through.
Neither plan edits `packages/shared/**`, `apps/server/src/index.ts`, `llm/client.ts`, `data.ts`, `finance/**`,
`guardrails/**`, `components/**`, `state/session.ts`, `lib/api.ts`, `router.ts`, `registry.ts`, `App.tsx` or
`data/synthetic/**`.

## Shared contract between c1 and c2 (both plans copy it; do not change it without the orchestrator)

### Routes (all mounted under `/api` by `apps/server/src/index.ts`)

| Route | Body | 200 response | Errors (`ApiError`) |
|---|---|---|---|
| `GET /api/estimates` | — | `EstimateSample[]` (3 items: `roof_clean`, `roof_messy`, `hvac_missing_total`) | — |
| `POST /api/application/prepare` | `PrepareRequest` | `PreparedApplication` | 400 `invalid_request`, 400 `unknown_contractor`, 400 `unknown_product`, 400 `unknown_estimate`, 503 `llm_unavailable`, 502 `llm_error` |
| `POST /api/income/plaid` | `PlaidRequest` (`{ demoOutcome }`) | `IncomeVerificationResult` | 400 `invalid_request` |
| `POST /api/income/document` | `{}` (body ignored) | `IncomeVerificationResult` (`status: "document_review"`) | — |
| `POST /api/submit` | `SubmitRequest` | `CreditDecision` (`decision` is `pending` or `conditional`, never `approved`) | 400 `invalid_request`, 400 `consent_required`, 400 `fields_incomplete`, 400 `income_not_verified` |

Error messages never echo request values.

### Field keys (the `PrefillField.key` values; c1 produces them, c2 renders and edits them)

| key | label | group | value type | produced by |
|---|---|---|---|---|
| `project.projectType` | Project type | project | string (snake_case, e.g. `roof_replacement`) | extraction |
| `project.scopeSummary` | Scope of work | project | string | extraction |
| `project.estimateTotal` | Estimate total | project | number (dollars) | extraction |
| `project.downPayment` | Down payment | project | number (dollars) | extraction |
| `financing.financedAmount` | Amount to finance | financing | number (dollars), note starts "computed by code" | code |
| `financing.product` | Financing option | financing | string (product name) | code, source `conversation` |
| `financing.priority` | Priority | financing | `"Lower monthly payment"` or `"Lower total cost"` | code, source `conversation` |
| `contractor.businessName` | Contractor | contractor | string | profile |
| `contractor.licenseNo` | License number | contractor | string | profile |
| `you.fullName` | Full name | you | string | homeowner on SCR-5 only |
| `you.address` | Home address | you | string | homeowner on SCR-5 only |
| `you.dateOfBirth` | Date of birth | you | string `YYYY-MM-DD` | homeowner on SCR-5 only |
| `you.ssnLast4` | SSN (last 4 digits) | you | string of 4 digits | homeowner on SCR-5 only |
| `income.grossAnnualIncome` | Gross annual income | income | number (dollars) | Plaid or document |
| `income.employer` | Employer | income | string | Plaid or document |

Money keys (formatted with `formatUsd`): `project.estimateTotal`, `project.downPayment`, `financing.financedAmount`,
`income.grossAnnualIncome`.

After prepare: every `you.*` field is `{ value: null, source: null, status: "needs_input", note: "The homeowner types this on Review." }`;
every `income.*` field is `{ value: null, source: null, status: "needs_authorization", note: "The homeowner connects their bank on the next step." }`.

Income results: `IncomeVerificationResult.fields` holds exactly the two `income.*` keys on `verified` and
`document_review`, and `[]` on `failed` and `insufficient`. c2 merges them with `mergeFields`.

Exact status lines (c1 writes them, c2 shows them verbatim):
- `failed`: `We couldn't finish connecting to Demo Credit Union: the bank's extra verification step timed out. Nothing was submitted and no decision was made.`
- `insufficient`: `We connected to Demo Credit Union but found fewer than 3 months of deposits, so your income couldn't be verified this way. Nothing was submitted and no decision was made.`
- `verified`: `Connected to Demo Credit Union. Income was read from 12 months of deposits. The lender's review decides, not this screen.`
- `document_review`: `We read your pay stub (paystub_2026-10-16.pdf). The lender's team reviews it before any decision.`

## Decisions recorded for segment C (from the orchestrator's brief, 2026-10-29)

- **Rung:** "call with tools in a bounded loop" (R-8). One rung lower (a single structured call) cannot show the agent
  choosing the order of its tools, which is the brief's "AI ecosystem fluency" point; one rung higher (planner,
  multi-agent) has no reason (agent-architecture rule 8). Fixed skeleton; the model picks the order of four tools.
- **Who answers "what next":** the model (which tool). **Who answers "am I done":** code — the loop ends when the model
  ends its turn or a brake fires; code assembles the final fields and checklist from tool results.
- **Four brakes:** 6 steps, 45 s wall clock, 40,000 tokens, 3 identical calls. Each is logged as `[agent] stop=<name>`.
- **Effort:** extraction `low` (one bounded read; the code validates every field). Agent `low` (it only orders four
  cheap tools; code assembles the output, so deeper reasoning adds latency without changing the result).
- **SCR-4 explanation via B's `guardedGenerate`** (orchestrator note from B's plan, 2026-10-29): `purpose: "exception_explain"`,
  `screen: "SCR-4"`, `auditInput: { event }` (no question), `allowedNumbers: []`, `disclosures: { estimateLine: ESTIMATE_LINE, lines: [] }`.
  B checks the safe template too, so C's safe templates and prompts carry no figures (digits, `$`, `%`, month/year
  counts) and none of: qualify, approved, pre-approved, eligible, guaranteed, "no risk", "you can afford" — not even
  negated. C passes no model params (B fixes `max_tokens` 400 and effort `low`). C mounts nothing under `/terms`
  (B's `GET /api/terms/:productId`).
- **Layout:** Foundation's `TaskLayout` turns its `action` slot into a fixed bottom bar below `lg`; C's screens put
  their primary action in `action` and add no phone bar of their own.
- **No model in submit** (R-14); the AI never judges income (R-11); income never rendered on SCR-3 (R-12).
