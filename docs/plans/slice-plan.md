# Slice plan — overnight demo build

**Status: APPROVED shape** (Innocent, 2026-10-29: "divide it into a major segments for parllelization and a code
review for each major segment with proper verification but in a broad way"). It replaces §7 tickets (skip S-4).
Requirements: `docs/prd/goodleap-prd.md` (R-n, C-n, acceptance §13); screens: `docs/ux/03-structure/SCREEN_SPECS.md`; flows/states: `docs/ux/01-planning/USER_FLOWS.md`; worked pairs: `docs/data/worked-pairs.md`; modules/interfaces: `docs/design/architecture.md` §3. Plan narrative: `docs/analysis/2026-10-28-overnight-demo-plan.md`. Hard limits: `.claude/rules/brief-conformance.md`.
Deadline 08:00 CT 2026-10-29; build done by about 06:30, design doc after.

## Stack and layout (Innocent: stack A, model Sonnet 5.5)

npm workspaces, Node 24, TypeScript throughout:

```
apps/web/        React 19 + Vite + Tailwind 4: Riverside direction B shell, rebranded GoodLeap
apps/server/     Node + TypeScript (Hono on @hono/node-server), Anthropic SDK, model "claude-sonnet-5-5"
packages/shared/ src/types.ts: the one shared types file (skip S-2: no OpenAPI or Prism)
data/synthetic/  JSON fixtures, each with "synthetic": true and a one-line description
var/             audit.jsonl (git-ignored), written at runtime
scripts/         guardrail-check.ts, e2e-smoke.ts
```

- **Dev command:** `npm run dev` starts the server (port 8787) and Vite (5173, proxying `/api`).
- **On the VPS:** prefix commands with `bin/with-provider-env` (or `../bin/with-provider-env` from the repo) so
  `ANTHROPIC_API_KEY` comes from `/home/linuxuser/workspaces/.env`. Never print it.
- **Ports:** pick free ones (other projects run servers on this VPS); kill only by PID.

## Segments

Foundation runs first and alone. Segments A, B, C and D then run in parallel, each with a `fanout-planner`
(session model) → `fanout-implementer` (Sonnet) pair, then a `code-review-agent` (Sonnet) review of that segment.
Each segment edits **only its owned files**. Shared files belong to Foundation; a segment that needs a change there
asks the orchestrator.

### F · Foundation (orchestrator, sequential, about 60 min)

Owns: the root `package.json`/workspaces/tsconfig/eslint, `apps/web` shell (`main.tsx`, `App.tsx`, `router.ts`,
`index.css`, `components/Shell.tsx`, `components/ui.tsx`, `components/Disclosure.tsx`), `apps/server/src/index.ts`
(mounts one route module per segment), `apps/server/src/llm/client.ts`, `packages/shared/src/types.ts`,
`data/synthetic/*`, `.env.example`, a README skeleton.

- **Theme:** copy and adapt Riverside's web shell and tokens from
  `/home/linuxuser/workspaces/inno-riverside-onboarding/apps/web/src/` (`index.css`, `components/Shell.tsx`,
  `components/ui.tsx`) and its `docs/design/design.md`: Manrope, lilac grain backdrop, a white window, the step rail,
  the centre task and the right summary column. Rename to **GoodLeap** with a "Concept prototype · synthetic data"
  tag in the top bar. The step rail lists the 7 screens of the plan.
- **Shared types:** `Product`, `Scenario` (monthly payment, total paid, total interest, APR, term, promo terms,
  disclosure fields), `AskRequest` / `GuardedAnswer`, `GuardrailResult`, `AuditRecord`, `PrefillField`
  (value, source: `estimate` | `profile` | `conversation` | `homeowner` | `plaid` | `document`; confidence; status
  `ready` | `needs_input` | `needs_authorization` | `needs_review`), `IncomeVerificationResult`,
  `CreditDecision` (`pending` | `conditional` | `approved` | `declined`; mocked, never produced by the LLM).
- **Interface for the guarded generator** (implemented by B, used by B and C):
  `guardedGenerate({ purpose, prompt, context, allowedNumbers, disclosures }) => Promise<GuardedAnswer>`, stubbed
  in `apps/server/src/guardrails/index.ts` with a fixed template until B lands.
- **Synthetic data:** copy `docs/data/samples/` (already written: catalog v2026-10-29, 3 estimates, contractors, plaid, paystub, credit engine) into `data/synthetic/`; each file is labelled synthetic:
  - `catalog.json`: 5–6 products. Fixed APRs at 5/10/15/25 years, a 0% intro product, and a deferred-interest
    18-month promo, each with plain terms text for the question box.
  - `contractors.json`: 2 profiles, one of them "ABC Roofing LLC".
  - `estimates/`: `roof_clean.txt`, `roof_messy.txt` (line items, handwritten-style abbreviations, a down payment)
    and `hvac_missing_total.txt`, plus a simple PDF of the messy estimate if time allows.
  - `plaid.json`: `success`, `connection_failed` (institution MFA timeout) and `insufficient_data`.
  - `paystub.json`: document-income result.
  - `credit-engine.json`: canned outcomes.
  - `roadmap.json`: written by D.
- **Placeholders:** each segment's screen and route file exists as a stub so segments never touch the router or the
  server index.
- **Done when:** `npm install && npm run dev` serves the shell with 7 empty screens, `npm run typecheck` passes, and
  `GET /api/health` returns ok.

### A · Quote and compare (no AI)

Owns: `apps/server/src/finance/**`, `apps/server/src/routes/quote.ts`, `apps/web/src/screens/Compare.tsx`,
`apps/web/src/screens/compare/**`, `apps/server/test/finance.test.ts`.

- **Maths:**
  - Amortization for fixed-rate products.
  - The 0% intro product (intro months, then amortized).
  - The deferred-interest promo: payment to clear it in the promo period, and the retroactive interest if it isn't
    cleared.
  - Total paid and total interest.
  - **Worked pair:** $30,000 at 8% for 15 years = **$286.70/month**.
- **Route:** `POST /api/quote {amount, priority}` → `Scenario[]`, ranked by the priority (lower monthly or lower
  total cost).
- **Screen:**
  - amount input with quick chips;
  - priority toggle;
  - three product cards side by side;
  - `<Disclosure>` inline on every card ("Estimated, not an offer or credit decision");
  - "Ask about this option" opens B's panel (Foundation renders the slot);
  - "Start application" carries the chosen scenario to C's screen.
- **Verify:** vitest worked pairs (fixed, intro, deferred), type check, and a screenshot.

### B · Ask about this option, guardrails, audit (AI)

Owns: `apps/server/src/assist/**`, `apps/server/src/guardrails/**`, `apps/server/src/audit/**`,
`apps/server/src/routes/ask.ts`, `apps/server/src/routes/audit.ts`, `apps/web/src/components/AskAboutOption.tsx`,
`apps/web/src/screens/Audit.tsx`, `scripts/guardrail-check.ts`.

- **Question box:** the LLM sees only the selected product's terms and that product's computed scenario numbers. It
  answers in 2–4 short sentences at a homeowner reading level. Off-topic questions and anything about
  eligibility/approval get a polite redirect.
- **Guardrails, in order:**
  1. **Number check:** every $ amount, % and term in the reply must be in `allowedNumbers`, allowing for rounding.
  2. **Approval language:** a rule list blocks "you qualify", "approved", "guaranteed", "pre-approved",
     "no risk" and similar.
  3. **Disclosures:** code attaches the APR, term, total cost of credit and the "not a credit decision" line,
     rendered with `<Disclosure>`.

  A failed check regenerates once with the reason; a second failure returns a safe template. Every outcome is
  logged.
- **Audit:** append-only `var/audit.jsonl`, one `AuditRecord` per borrower-facing message, holding:
  - the request, the product id, the catalog version, the computed numbers and the prompt version;
  - the model's raw output, every guardrail result and the final text shown;
  - the model name, the latency and the time.

  The **Audit** screen lists the records, with the raw output and the final text side by side.
- **`scripts/guardrail-check.ts`:** about 10 crafted bad outputs (a wrong payment, "you're approved", a missing
  APR, an invented rate and others) fed straight to the guardrail, printing a pass/fail table. All must be blocked.
- **Verify:** the guardrail script, 3 live questions through the API, the type check and a screenshot.

### C · Application prep agent, income verification, submit (AI + agentic)

Owns: `apps/server/src/application/**`, `apps/server/src/integrations/**` (Plaid, document income and credit engine
mocks), `apps/server/src/routes/application.ts`, `apps/web/src/screens/StartApplication.tsx`,
`apps/web/src/screens/VerifyIncome.tsx`, `apps/web/src/screens/Review.tsx`.

- **Extraction:** the LLM reads an estimate through tool use with a JSON schema: project type, amount, down payment,
  scope summary, and a source quote for each field. Code validates it (amount 5K–100K; the financed amount is the
  total minus the down payment) and marks low-confidence or missing fields `needs_review` or `needs_input`, never
  guessing them.
- **Application-prep agent:** a fixed skeleton with one bounded tool loop (at most 6 steps).
  - **Tools:** `get_contractor_profile`, `get_selected_scenario`, `extract_estimate`, `list_missing_fields`.
  - **Output:** `PrefillField[]` plus a short checklist of what the homeowner still has to do.
  - The step trace is shown on screen, collapsed, as an "agent steps" list.
- **Verify income** (the homeowner's own step):
  - A synthetic Plaid Link sheet with two demo buttons, "Connect bank (succeeds)" and "Connect bank (fails)".
  - **On failure,** `guardedGenerate` explains in plain words what happened and offers the pay-stub path, which uses
    the mocked Document Income result. The AI never judges whether the income is enough.
- **Review and submit:**
  - Every field with its source chip and an edit control.
  - The consent checkboxes and `<Disclosure>`.
  - `POST /api/submit` → the mocked credit engine → `pending` or `conditional`, shown as the engine's result.
- **Verify:** extraction on all 3 estimates (the missing total → `needs_input`), the agent trace, both Plaid paths,
  the type check and screenshots.

### D · Where we'd take it next (direct lane, no build loop beyond its screen)

Owns: `docs/research/2026-10-29-historical-baseline.md`, `data/synthetic/roadmap.json`,
`apps/web/src/screens/Roadmap.tsx`.

- **Verify on the web** each historical claim in `docs/source/04-chatgpt-product-direction.md` (turns 8–9): the
  GoodLeap QuickLink V3 partner instructions dated 2023-02-23, the "Goodleap New Application Process" contractor
  guide, the ServiceTitan GoodLeap financing documentation and its discontinuation notice, S&P 2022 and Fitch 2023.
  Record the URL, the date read and what the source actually says; mark each one verified, partly verified or not
  found.
- **Page:**
  1. **Where it started:** verified history only; anything unverified is labelled (PRD R-16).
  2. **What this demo changes:** each brief friction point → the screen that addresses it.
  3. **Where we'd go next:**
     - **Next 2 weeks:** portal embed and a 25–50 contractor pilot measuring completion rate (baseline 62%) and
       time.
     - **Next quarter:** real Plaid with funnel analytics, contractor-estimate and scope-letter extraction for the
       review queue, a homeowner share link, and product ranking from Snowflake funnel data.
     - **Later:** voice on site, Spanish, compliance sampling, and drift monitoring feeding the v1 → v2 loop.

     Each item names its friction point, its metric and why it waited.
  4. **Assumptions we made:** labelled.
- **Verify:** every claim on the page has a source line or an "assumption" label; screenshot.

## Collision map

| File or area | Owner |
|---|---|
| Router, server index, shell, `ui.tsx`, `Disclosure.tsx`, `types.ts`, `llm/client.ts`, synthetic data except `roadmap.json` | F |
| `finance/`, `quote.ts`, `Compare.tsx` | A |
| `assist/`, `guardrails/`, `audit/`, `ask.ts`, `audit.ts`, `AskAboutOption.tsx`, `Audit.tsx` | B |
| `application/`, `integrations/`, `application.ts`, three application screens | C |
| research note, `roadmap.json`, `Roadmap.tsx` | D |

C depends on B only through `guardedGenerate` (its stub keeps C unblocked). A renders B's `AskAboutOption` in
the slot Foundation placed.

## After the segments (orchestrator)

1. **Integrate:** run the whole journey, then fix the seams.
2. **Review:** one `code-review-agent` (Sonnet) per segment, checking brief conformance, no LLM-made numbers or
   decisions, and secrets. Fix Blocking findings.
3. **Broad checks:**
   - type check and lint;
   - `npm test` (the finance worked pairs);
   - `scripts/guardrail-check.ts`;
   - `scripts/e2e-smoke.ts` (Playwright: the happy path and the Plaid-failure path, with screenshots to
     `docs/artifacts/screens/`).
4. **Documents:**
   - the README with a setup under 5 minutes;
   - the 2–3 page design doc in `docs/` (the brief's six sections, drawing on the ChatGPT conversation and the brief
     audit);
   - the combined §1–§4 review page (skip S-1; a direct agent can write it during the build);
   - a walk through `SUBMISSION.md`.
5. **Commit and push to GitLab** `origin` only when Innocent says so. A GitHub mirror for the submission still needs
   his yes.
