# 2026-10-29 — Overnight demo build on the VPS

- **Project:** inno-goodleap · **Timezone:** US Central · **Writer:** Claude Code (Opus 5.5), orchestrator ·
  **Host:** VPS `claude-vultr:/home/linuxuser/workspaces/inno-goodleap`, branch `main`, no commits ·
  **Sources:** `docs/plans/HANDOFF-VPS-BUILD.md`, `docs/plans/slice-plan.md`, PRD v1.0.

## Foundation (segment F) — 01:08–01:15 CT

- **Changed:** npm workspaces (`packages/shared`, `apps/server`, `apps/web`); one install at the root (234 MB).
  - Shared contract `packages/shared/src/types.ts` (Product, Scenario with `allowedNumbers` and `disclosures`,
    GuardedRequest/GuardedAnswer, AuditRecord, PrefillField, IncomeVerificationResult, CreditDecision, Roadmap) and
    `format.ts` (money formatting, the estimate and RESPA disclosure lines, shared by server and web).
  - Server: Hono on 127.0.0.1:8787, one route module per segment mounted under `/api`, `/api/health`, an `onError`
    that never returns stack traces. `llm/client.ts` is the only SDK import (`LlmClient`, `getLlm()`, `FakeLlm`).
    `data.ts` reads `data/synthetic/` (copied from `docs/data/samples/` plus `estimates/index.json` and a
    placeholder `roadmap.json`).
  - Web: Riverside direction B shell (tokens, Manrope, lilac grain backdrop, window, rail, top bar) rebranded
    GoodLeap, with the "Concept prototype · synthetic data" tag, a 5-step journey rail with a "Hand to homeowner"
    divider, reviewer links to Audit and Next, Start over, and a light-default theme toggle. Shared pieces:
    `ui.tsx` primitives (incl. SourceChip, StatusPill, ElapsedTimer, SlideOver), `Disclosure.tsx`,
    `Summary.tsx`, `state/session.ts` (the store that carries the chosen scenario, fields, income and decision
    between screens), `lib/api.ts`. SCR-2 renders as a slide-over owned by the shell, so A and B never import each
    other.
  - Contract stubs for parallel work: `finance/index.ts` (`quote`, `scenarioFor`, `FinanceError`) and
    `guardrails/index.ts` (`guardedGenerate`), plus a stub per segment route and screen.
- **Why:** slice plan: Foundation first and alone; segments edit only their own files. The finance stub was not in
  the slice plan: B (ask) and C (agent) both need scenario numbers, so the signatures had to exist before they
  started.
- **Checked:** `npm run typecheck` and `npx eslint .` pass; `GET /api/health` → `{"ok":true,"model":"claude-sonnet-5-5","llmKey":true}`;
  Vite proxies `/api`; shell screenshot at 1440×900 renders with no console errors; one live call to
  `claude-sonnet-5-5` (effort low) answered in 2.1 s.
- **Sonnet 5.5 API notes recorded in `llm/client.ts`:** no `temperature`; forced `tool_choice` returns 400, so
  extraction uses structured outputs and the agent uses `auto` with strict tools; refusals (`stop_reason:
  "refusal"`) count as a failed attempt and fall to the safe template. No server-side model fallback, so the audit
  record's model name stays true.
- **Remaining:** segments A–D (dispatched 01:15 CT), reviews, smoke run, README, design doc.

## Decisions taken during the build (for Innocent's morning review)

- **INTRO-0 ranking.** WP-1's table puts `GL-INTRO-0` third under "lower monthly payment", which matches no single
  rule (its first payment, $250, would rank it first; its later payment, $379.98, after FIX-10). Segment A ranks
  by the highest scheduled payment, so a 0% teaser never tops the list on its intro payment. Top three at $30,000
  become FIX-25, FIX-15, FIX-10. Status: decided by Claude, reversible in one function.
- **Segment D runs as one agent** (research + a static page), per the slice plan's direct lane; A, B and C each
  run planner (Opus) → implementer (Sonnet) → review (Sonnet).
- **No test-writer step.** The slice plan Innocent approved replaces tickets with one code review per segment
  (S-4, D-7), so B's guardrail and C's submit path get unit tests written with the code, not frozen tests first.

## Segment D (roadmap) — done 01:20 CT

- **Changed:** `docs/research/2026-10-29-historical-baseline.md` (12 claims checked on the web, read 2026-10-29),
  `data/synthetic/roadmap.json`, SCR-7 (`screens/Roadmap.tsx`, `screens/roadmap/parts.tsx`).
- **Why:** R-16: the roadmap page cites only verified history.
- **Checked:** 5 claims verified (ServiceTitan's in-estimate GoodLeap financing and its April 2026 discontinuation,
  GoodLeap Pros app, shared application link, Plaid income products), 3 partly verified, 4 not found (QuickLink V3
  instructions, the contractor application guide, the S&P 2022 and Fitch 2023 specifics). Only verified and partly
  verified lines appear as baseline; one line is labelled Assumption. Type check, eslint and screenshot pass.
- **Remaining:** design doc should note that GoodLeap may already automate some income-document review (Ocrolus case
  study, partly verified) and ask which documents are still reviewed by hand.

## Segment A (quote and compare) — done 01:30 CT

- **Changed:** `apps/server/src/finance/*` (pure maths), `routes/quote.ts`, `test/finance.test.ts` (19 tests),
  SCR-1 (`screens/Compare.tsx`, `screens/compare/*`). Foundation fixes from the planner's findings: route stubs no
  longer use a catch-all (the first one mounted swallowed every `/api` path); `QuoteResponse.amountRange`;
  `TaskLayout` turns its action into a fixed bottom bar below `lg`.
- **Why:** R-1…R-3, WP-1; acceptance §13 (`GL-FIX-15` $286.70 / $51,605.21).
- **Checked:** vitest 19/19; curl at $30,000 returns FIX-15 at 286.70 / 51605.21; $4,000 → 400 `amount_below_min`
  without echoing input; Playwright run (10 assertions) and four screenshots. Code review: 0 Blocking, 3 Should fix,
  all fixed by the orchestrator (card buttons disabled while a new quote loads; the INTRO-0 headline shows the later
  payment beside the teaser; `1.5` years added to DEF-18's allowed numbers), plus stale cards hidden on server error.
- **Decisions:** totals from unrounded payments rounded once (the only rule that reproduces every WP-1 figure;
  README assumption 7); ranking rule recorded in WP-1 and README assumption 8.

## Segment B (ask, guardrails, audit) — built 01:31 CT, review fixes done 01:35 CT

- **Changed:** `guardrails/{policy,checks,index}.ts`, `audit/store.ts`, `assist/{prompt,figures,ask}.ts`,
  `routes/{ask,audit}.ts` (plus `GET /api/terms/:productId`), SCR-2 (`AskAboutOption.tsx`), SCR-6 (`Audit.tsx`,
  `screens/audit/*`), `scripts/guardrail-check.ts`, `test/guardrails.test.ts` (42 tests).
- **Why:** R-4…R-6, R-15, C-1…C-6; the brief's "at least one guardrail" and "exactly what the system said and why".
- **Checked:** vitest 42/42; guardrail script 13/13 crafted bad outputs blocked, 2/2 good passed. Live on
  `claude-sonnet-5-5`: the WP-2 promo question → `shown`, 1 attempt, 1.9–2.2 s, cites $11,245.50 and $1,666.67;
  "Will I qualify?" → `redirected` in code, no model call; weather → model says `OFF_TOPIC` → template.
- **Review:** 0 Blocking, 5 Should fix (paraphrased reassurance passes the phrase list; counts written as "payments"
  unchecked; ±$1 tolerance lets small dollar figures match a month count; a `max_tokens` cut-off answer is shown;
  SCR-6 over-claimed that no identity reaches the log while free-text questions are stored verbatim). Sent to one
  implementer with an inline plan (patterns, unit regex, tolerance only ≥ $100, truncation = failure, SSN/email/phone
  masking, corrected SCR-6 sentence). Remaining limits go in the design doc §4.
- **Fixes checked:** vitest 48/48; guardrail script 16/16 bad blocked (adds "good shape", "24 payments", "$19 a
  month"), 2/2 good passed; type checks and eslint clean; live WP-2 question still `shown`, 1 attempt, 2.3 s.

## Segment D review — 0 Blocking, 4 Should fix (fixed by the orchestrator)

- **Changed:** `roadmap.json` wording (Origin no longer called "internal"; the 2023 calculator assumption no longer
  restates detail from the confidential source; the promo friction uses the brief's words; the Spanish item labelled
  an assumption; "our bar: zero"), the SCR-7 notice credits the 25–50 pilot size to our proposal, and slice plan §D
  now matches PRD R-16 (unverified history appears only when labelled).
- **Checked:** JSON parses; web type check passes.

## Design doc drafted — 01:34 CT

- **Changed:** `docs/design-doc.md`, the brief's six sections (~1,900 words, about 3 pages). Production sizing (load,
  peak, failure to survive, spend ceiling) is named as waiting on Innocent's answers (SDQ-1…5), not invented.
- **Remaining:** add segment C's measured figures; final pass after the smoke run.

## Segment C1 (application server) — built 01:40 CT

- **Changed:** `apps/server/src/application/*` (extraction with structured output, a 4-tool agent loop with four
  brakes, field assembly in code, income, submit), `integrations/*` (one mock adapter per external system),
  `routes/application.ts` (5 routes), `test/application.test.ts` (31 tests on FakeLlm).
- **Why:** R-7…R-14, WP-3, WP-4; C-6 (no identity or income reaches a model).
- **Checked:** vitest 31/31; live on `claude-sonnet-5-5`: roof_clean financed 30,000 ready; roof_messy down payment
  2,000, financed 28,000 `needs_review` (differs from the $30,000 quote; matches the estimate's balance due); hvac
  total, down payment and financed all `needs_input` (no invented number). Agent: 4 steps each run, prepare ≈ 8.4–9.2 s,
  extraction ≈ 2–3 s. Plaid failure and insufficient-data explanations `shown` via the guarded generator in 1.5–1.8 s;
  pay stub annualised by code to 68,900.00 `needs_review`; submit 400 without consents, `pending` with Plaid income,
  `conditional` with document income. Code review dispatched.

## Segment C reviews and fixes — 01:36–01:42 CT

- **C1 review:** 1 Blocking. Extraction checked that a source quote is in the estimate but not that the number is in
  the quote, so a hallucinated total with any real phrase came back `ready`. Plus 6 Should fix. **Fixed:** numbers
  must appear in their quote (else `needs_review`); quotes under 4 characters rejected; model-written scope summary
  `needs_review` when it uses words not in the estimate; submit requires all 15 fields and non-null identity and
  income; 502 handling on income and submit; the extra agent turn after `list_missing_fields` removed (prepare now
  4.6–9.2 s live, extraction dominates); the wall-clock brake covers extraction; amount range enforced on prepare.
  vitest 36/36. Known limit kept for the design doc: verified income travels with the client session in the demo.
- **C2 review:** 1 Blocking (choosing another option after preparing left the old application in place). **Fixed in
  the Foundation store:** a change of chosen scenario clears prepared fields, income and decision; storage key bumped;
  danger notices announce as alerts. 7 Should fix sent to one implementer (disclosure on the result card, income jump
  link, retry on estimates, one primary action per screen, financed-amount edit guard, amount-mismatch notice).
- **Smoke run found a real bug:** Start over on Compare left the screen empty because the quote hook didn't refetch.
  Fixed in `useQuote` (re-runs when the stored quote disappears).

## Integration, smoke run, design doc, records — 01:42–01:50 CT

- **Changed:** C2 review fixes landed (disclosure on the result card, income jump link, retries, one primary action
  per screen, financed-amount edit guard, amount-mismatch notice). `scripts/e2e-smoke.ts` (12 steps, both PRD flows,
  screenshots `docs/artifacts/screens/smoke-*.png`). Design doc rewritten to fit: `docs/design-doc.md` (1,450 words)
  and `docs/design-doc.pdf` (3 Letter pages at 10 pt). Review page WP-1 order updated and re-stamped. README,
  `SUBMISSION.md`, checklist §8, router and resume note brought current.
- **Checked:** `npm run typecheck` 0 errors; `npm run lint` clean; `npm test` 103/103; `npm run guardrail-check`
  16/16 blocked, 2/2 good; `npm run smoke` 12/12 on `claude-sonnet-5-5` (ask 2.9 s, prepare 6.9–7.1 s, explanation
  2.9 s incl. UI). Fresh copy (no `node_modules`) installs and serves in 5 s on a warm npm cache.
  `check_review_page.py`: 0 fails (the length warning predates this run).
- **Remaining:** Innocent's morning review; the sizing answers (SDQ-1…4) for design doc §5; commit and push when he
  says (nothing is committed); GitHub mirror needs his yes.

## Innocent's answers — 2026-10-29 morning

- **SDQ-1 decided:** "yes" to the recommendation: the production design targets a 50-contractor pilot with a written
  path to all 15,000 contractors. Recorded as PRD D-15 and in `architecture.md` §5; design doc §5 updated. SDQ-2…4
  (peak concurrency, failure to survive, spend ceiling) stay open and the doc says so.
- **Commit and push:** "commit and push". GitLab `origin` only; the GitHub mirror still needs his explicit yes
  (`project-provenance`).
