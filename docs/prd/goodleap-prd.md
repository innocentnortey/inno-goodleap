# PRD — GoodLeap Guided Financing Journey (demo)

**Version 1.0 · 2026-10-29 00:50 CT · Status: APPROVED to build by Innocent's standing answers (see §11); he reviews the combined page in the morning and anything he changes is reworked.**
Owner: Innocent Nortey. Drafted by Claude.
Sources: the brief (`docs/source/01-goodleap-brief.md`, ISSUED, wins every disagreement) · Innocent's ChatGPT conversation (`03-`, `04-`, CONTEXT, sets the direction) · brief audit (`docs/analysis/2026-10-28-brief-audit.md`) · hard limits (`.claude/rules/brief-conformance.md`).
Labels: **[B]** stated in the brief · **[C]** from the ChatGPT conversation · **[D-n]** Innocent's decision · **[A]** assumption we state in the README.

## 1. What this is, in one paragraph

A demo of an **AI-assisted financing journey** inside a home-improvement lender's contractor portal. A contractor quoting a $30,000 roof shows the homeowner three financing options side by side, the homeowner asks one hard question about a promo and gets a grounded, compliant answer, the contractor uploads the estimate and an agent prefills the application, income verification through Plaid fails and the product recovers instead of losing the homeowner, and the application goes to the lender's (mocked) credit engine, which alone decides. Buttons handle decisions, AI handles ambiguity and messy documents, code handles every number, disclosure and decision. It is a prototype for an interview, not a product [D-2].

## 2. The problem (layer 2 first)

- **Why the lender wrote the brief [B]:** contractors "lose deals because they can't give customers quick answers about financing options while on-site". The VP of Contractor Partnerships: closing 10% more deals "is worth $200M in annual origination volume" (volume, not revenue [C]).
- **Where the money leaks [B]:** 38% of applications are abandoned, mostly at **loan product selection** and **income verification**; applications take 22 minutes against a sub-10 benchmark; staff extract document details by hand.
- **What is underneath (brief audit):** at both drop-off points the homeowner hits something they don't understand (a promo's terms; a failed bank link) and nothing helps them through it. The quote itself is arithmetic and was already a solved problem in 2023 [C, unverified history].
- **The hypothesis [C, adopted]:** *If the homeowner can see the tradeoffs plainly, get a trustworthy answer to the one question that is stopping them, and get through verification without retyping or dead ends, more started applications complete, without the AI ever making or implying a credit decision.*

## 3. Users

| User | In the demo | What they need |
|---|---|---|
| **Contractor** (primary operator) | Enters the amount, picks the homeowner's priority, uploads the estimate, starts the application | A payment answer in seconds; to look competent; not to touch the homeowner's financial details |
| **Homeowner** (decides; takes over for sensitive steps [A]) | Compares options, asks the question, verifies income on their own step, confirms and submits | To understand what they are agreeing to; to feel safe; to finish |
| **Compliance reviewer** | Opens the Audit screen | "Exactly what the system said and why" [B] |
| **Interview reviewer** | Runs the README, clicks through, reads the roadmap page | Judgment: why AI here and not there; what was mocked and why |

## 4. Scope

**In (one vertical slice, happy path + one friction case):**
1. Compare options (no AI).
2. Ask about this option (AI, guarded).
3. Start application with an application-prep agent (AI, agentic).
4. Verify income: synthetic Plaid, with the **connection-failure recovery** (friction case).
5. Review and submit to a mocked credit engine.
6. Compliance audit view.
7. "Where we'd take it next" page.
8. README (setup < 5 min), 2–3 page design doc written after the build [D-3 answer].

**Out (named, with the reason, each on the roadmap page):**
- A homeowner-facing public app, authentication, multi-tenant portal plumbing: not the friction the brief names.
- Real Plaid, real document management, real credit engine: the brief says mock them [B].
- Pay-stub / W-2 extraction as a product feature: Plaid Document Income may already cover it [C]; the demo mocks the result.
- Fine-tuning, embeddings/RAG over a document corpus: the product terms fit in context; a retrieval layer would be a science project [B, CTO].
- Voice, Spanish, monitoring dashboards: roadmap.

## 5. The journey and its screens

Each screen carries a `SCR-n` id (specs in `docs/ux/03-structure/SCREEN_SPECS.md`) and a story (`US-n`).

| # | Screen | Who | What happens | AI? |
|---|---|---|---|---|
| SCR-1 | **Compare options** | Contractor + homeowner | Amount, priority (lower monthly / lower total cost), three catalog products side by side with monthly payment, total paid, total interest, APR, term, promo conditions, inline disclosure | No |
| SCR-2 | **Ask about this option** (panel on SCR-1) | Homeowner | A question about the selected product; a 2–4 sentence grounded answer with disclosures; off-scope and eligibility questions redirected | Yes, guarded |
| SCR-3 | **Start application** | Contractor | Upload / pick an estimate; the agent gathers profile + scenario + extracted fields, lists what is missing, shows its steps | Yes, agentic |
| SCR-4 | **Verify income** | Homeowner (own step) | Synthetic Plaid Link; on failure a plain-words explanation and the pay-stub path | Yes, for the explanation only |
| SCR-5 | **Review and submit** | Homeowner | Every field with its source chip and edit control; consents; submit → engine result | No |
| SCR-6 | **Compliance audit** | Reviewer | Every borrower-facing message with inputs, numbers, guardrail results, raw vs final text | No |
| SCR-7 | **Where we'd take it next** | Interview reviewer | Verified baseline → what the demo changes → roadmap by horizon → assumptions | No |

## 6. Functional requirements

**Quote and compare**
- **R-1.** `POST /api/quote {amount, priority}` returns scenarios for every catalog product, ranked by priority. Amount outside the catalog range ($5K–$100K [B]) returns a clear error, not an empty list.
- **R-2.** Payment maths is deterministic code with unit tests: fixed-rate amortization; the 0% intro product; the deferred-interest promo (payoff payment and the retroactive interest if not cleared). Worked pair WP-1.
- **R-3.** Every scenario card shows the inline disclosure: estimated, not an offer or credit decision; APR; term; total cost of credit.

**Ask about this option**
- **R-4.** The model sees only: the selected product's terms text, that product's computed scenario numbers, and the homeowner's question. No other products, no homeowner financial data.
- **R-5.** Answers are 2–4 short sentences at a plain reading level, end with an offer to see the full terms, and never state or imply eligibility, approval or affordability. Questions outside the product (eligibility, credit score, other lenders, unrelated topics) get a polite redirect template. WP-2.
- **R-6.** Every answer passes the guardrail chain (§7) before display and is written to the audit log (§8).

**Application prep**
- **R-7.** Estimate extraction returns typed fields (project type, total, down payment, financed amount, scope summary) each with a **source quote** and a confidence. Code validates ranges; low confidence or a missing value becomes `needs_review` / `needs_input`. Nothing is guessed silently. WP-3.
- **R-8.** The application-prep agent is a fixed skeleton with one bounded tool loop (≤ 6 steps) over `get_contractor_profile`, `get_selected_scenario`, `extract_estimate`, `list_missing_fields`. Its output is `PrefillField[]` plus a homeowner checklist; its steps are visible on screen (collapsed).
- **R-9.** Prefilled fields come from: estimate, contractor profile, conversation (the chosen priority), Plaid, document; homeowner identity fields are always `needs_input`.

**Verify income**
- **R-10.** Synthetic Plaid Link with explicit demo controls: *connect (succeeds)*, *connect (fails)*. Success fills the income fields with `plaid` as source.
- **R-11.** On failure, the product explains in plain words what happened and offers the document path (mocked Document Income result), with `document` as source and `needs_review` status. The AI never judges whether income qualifies. WP-4.
- **R-12.** Income data is shown only on the homeowner's step, never on the contractor's screens [C, adopted].

**Review and submit**
- **R-13.** The homeowner can edit any prefilled field; edits change the source to `homeowner`. Consents and disclosures must be ticked before submit.
- **R-14.** `POST /api/submit` sends the application to the mocked credit engine, which returns `pending` or `conditional` (canned). The UI presents it as the engine's result; no LLM is in this path.

**Audit and roadmap**
- **R-15.** The Audit screen lists every `AuditRecord` (schema §8) newest first, raw model output beside the final text, with each guardrail check and its result.
- **R-16.** The roadmap page cites only verified history; anything unverified is labelled; every roadmap item names the friction point it addresses, the metric it should move, and why it waited.

## 7. Compliance and guardrails (hard constraints, `brief-conformance.md`)

- **C-1. No credit decision, stated or implied [B].** Guardrail check 2 (approval language) blocks "qualify", "approved", "pre-approved", "guaranteed", "you'll get", "no risk" and similar; the system prompt forbids eligibility talk; the redirect template handles eligibility questions.
- **C-2. Disclosures on every borrower-facing message [B].** Attached by code (check 3), never by the model: APR, term, total cost of credit, "estimated; not an offer or a credit decision".
- **C-3. Numbers never come from the model.** Check 1 verifies every $ amount, % and term in the reply against the computed scenario (rounding tolerance); a mismatch fails the check.
- **C-4. Fail safe.** One regeneration with the failure reason; a second failure returns the safe template. Every outcome is logged.
- **C-5. Auditable [B].** §8.
- **C-6. Data minimisation.** The model never receives homeowner identity or income values; extraction sees estimate text only.

## 8. Audit record (what Compliance sees)

```
AuditRecord {
  id, time, screen, purpose ("ask" | "exception_explain"),
  productId, catalogVersion, promptVersion, model,
  inputs: { question | event, allowedNumbers, disclosures },
  rawOutput, checks: [{ name, passed, detail }], attempts,
  finalText, outcome ("shown" | "regenerated" | "redirected" | "safe_template"),
  latencyMs
}
```
Append-only JSON lines in `var/audit.jsonl` (git-ignored). Good enough for a demo; the design doc names the production home (RDS + S3 [B]).

## 9. Synthetic data [D-3]

All under `data/synthetic/`, each file carrying `"synthetic": true` and a one-line description; samples also kept in `docs/data/samples/` for the record.

| Set | Contents |
|---|---|
| `catalog.json` v`2026-10-29` | `GL-FIX-05` 6.99% / 5 yr · `GL-FIX-10` 7.49% / 10 yr · `GL-FIX-15` 8.00% / 15 yr · `GL-FIX-25` 9.49% / 25 yr · `GL-INTRO-0` 0% for 12 months then 9.99% over the remaining 108 months of a 10-year term (principal-only payments during the intro) · `GL-DEF-18` deferred interest, 84-month term: no interest if paid in full within 18 months, otherwise 24.99% accrues from day one. Each with plain terms text for SCR-2 |
| `contractors.json` | `ABC Roofing LLC` (Austin, TX) and `Lone Star HVAC` |
| `estimates/` | `roof_clean.txt`, `roof_messy.txt` (line items, abbreviations, a $2,000 deposit), `hvac_missing_total.txt` |
| `plaid.json` | `success`, `connection_failed` (institution MFA timeout), `insufficient_data` |
| `paystub.json` | mocked Document Income result (gross pay, pay frequency, employer, annualised by code) |
| `credit-engine.json` | `pending`, `conditional` outcomes with canned reasons |
| `roadmap.json` | the SCR-7 content, written by segment D |

## 10. Non-functional

- **Runs locally in under 5 minutes [B]:** `npm install`, copy `.env.example` to `.env` with one key, `npm run dev`. One real LLM key (`ANTHROPIC_API_KEY`); everything else mocked.
- **Model:** `claude-sonnet-5-5` for SCR-2, extraction and the agent [D answer 2]; guardrails are code, no second model.
- **Latency target [A]:** SCR-2 answer p95 ≤ 5 s; extraction ≤ 10 s. Shown as a timer on screen so the reviewer sees it.
- **Theme:** Riverside direction B (Manrope, lilac grain backdrop, white window, step rail, centre task, right summary) rebranded GoodLeap, with a visible "Concept prototype · synthetic data" tag [D-6].
- **Verification [D-7]:** type check and lint; vitest worked pairs for the maths; `scripts/guardrail-check.ts` (≈10 bad outputs, all blocked); one scripted Playwright run of both paths with screenshots. One code review per segment.
- **Secrets:** never committed, never printed; `.env.example` only.

## 11. Decisions

| ID | Decision | Basis | Status |
|---|---|---|---|
| D-1 | The ChatGPT conversation sets the direction | Innocent, 2026-10-28 | decided |
| D-2 | Demo for the interview, not a product; not feature-intensive | Innocent | decided |
| D-3 | Heavy synthetic data so Plaid and the credit engine appear | Innocent | decided |
| D-4 | Finished overnight: **deadline 08:00 CT 2026-10-29** | Innocent | decided |
| D-5 | Agentic features where they fit: the application-prep agent | Innocent | decided |
| D-6 | Riverside theme and texture, rebranded GoodLeap | Innocent | decided |
| D-7 | General verification, not heavy testing | Innocent | decided |
| D-8 | Stack A: React 19 + Vite + Tailwind 4 frontend, TypeScript/Node backend (matches the brief's stack) | Innocent, "whatever the briefing asked of us its looks like A" | decided |
| D-9 | Claude Sonnet 5.5 for all model calls | Innocent, "yes" | decided |
| D-10 | Design doc written after the build, from the ChatGPT analysis + brief audit | Innocent | decided |
| D-11 | Buttons for decisions, AI for ambiguity and documents, code for numbers | Innocent's critique 2026-10-28 ("just another chatbot…") + ChatGPT's final recommendation | decided |
| D-12 | Homeowner takes over for sensitive steps; contractor never sees income data | ChatGPT turn 5; brief silent on the handoff | **assumption** |
| D-13 | Plaid failure (not pay-stub extraction) is the friction case | Plaid exists [B]; its failure path is the likelier gap [C] | decided |
| D-14 | No RAG / fine-tuning: product terms in context | brief §3 asks the question; terms are short | decided (defended in design doc) |
| D-15 | Production design target: a 50-contractor pilot, with a written path to all 15,000 contractors (SDQ-1) | Innocent, 2026-10-29: "yes" to the recommendation | decided |
| S-1…S-4, S-6 | Process skips | `PROJECT-CHECKLIST.md` → Skips | decided |

## 12. Assumptions the README states [A]

1. The company is GoodLeap (file name only).
2. The homeowner completes verification and submission on their own device/step.
3. Catalog products, APRs and promo mechanics are invented and labelled.
4. Plaid Link, Document Income, the credit engine and the contractor profile service are mocked with canned responses.
5. The 22-minute figure's split by step is unknown; the demo does not claim a specific time reduction.
6. GoodLeap's history on the roadmap page is included only where verified by segment D.

## 13. Acceptance (what "done" means at 06:30 CT)

- [ ] Fresh clone → running app in under 5 minutes following the README.
- [ ] SCR-1 shows the top three products for $30,000 by priority, all six on "Show all", with `GL-FIX-15` at $286.70/mo, $51,605.21 total.
- [ ] SCR-2 answers "What happens if I don't pay off the deferred-interest plan in 18 months?" with the $11,245.50 retroactive-interest figure and the disclosures, and redirects "Will I qualify?".
- [ ] `scripts/guardrail-check.ts` blocks all ≈10 crafted outputs.
- [ ] SCR-3 extracts all three estimates; the HVAC one yields `needs_input` for the total; the agent trace shows ≤ 6 steps.
- [ ] SCR-4 failure path shows the explanation and the document route; success path fills income from `plaid`.
- [ ] SCR-5 submits and shows the engine's `pending`/`conditional`.
- [ ] SCR-6 shows one record per SCR-2/SCR-4 message with raw vs final text and check results.
- [ ] SCR-7 cites only verified history; every item has friction point, metric, reason.
- [ ] Type check, lint, vitest and the Playwright smoke run pass; screenshots in `docs/artifacts/screens/`.
- [ ] `SUBMISSION.md` rows P1–P7 ticked with evidence; D1–D7 after the design doc.
