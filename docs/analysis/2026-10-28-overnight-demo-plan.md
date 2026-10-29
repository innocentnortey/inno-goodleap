# Overnight demo plan

**Status: APPROVED to build** — Innocent, 2026-10-29 00:13 (stack A, Sonnet 5.5, deadline 08:00 CT, skips S-1…S-4 and S-6, per-segment review). Drafted by Claude, 2026-10-28. It supersedes `2026-10-28-nine-hour-scope-proposal.md`. The product
direction comes from Innocent's ChatGPT conversation (`docs/source/03-…` and `04-chatgpt-product-direction.md`,
CONTEXT); the brief (`01-goodleap-brief.md`, ISSUED) wins any disagreement.

## Decisions Innocent has already made (2026-10-28, his words)

| ID | Decision | His words |
|---|---|---|
| D-1 | The ChatGPT conversation defines the product direction | "use this conversation that I had with ChatGPT to define the product direction" |
| D-2 | A demo for the interview, not a product; not feature-intensive | "We don't need a product. This is supposed to be a demo … We won't be feature-intensive" |
| D-3 | Heavy synthetic data, so integrations such as Plaid can appear | "use a lot of synthetic data … That way, we can include stuff like the Plaid integration" |
| D-4 | Finished overnight | "this needs to be finished overnight" |
| D-5 | Agentic features where they fit the time | "if we can incorporate certain agentic features in a timely manner, that'd be best" |
| D-6 | UI reuses Riverside's texture and theme, rebranded GoodLeap | "use the same texture and theme from our Riverside project … change the branding to GoodLeap" |
| D-7 | General verification checks, not heavy testing | "id like to just do general verifcations" |

## The product: a guided financing journey (ChatGPT's final recommendation)

**The rule of the design:**
- Structured UI for decisions.
- AI for ambiguity and unstructured documents.
- Deterministic code for every number, disclosure and decision.
- "Don't make the customer converse with an AI to accomplish something they could complete faster with one click."

**The story the demo tells:**
1. A contractor quotes a $30,000 roof.
2. The homeowner compares financing options.
3. The homeowner asks a question about the deferred-interest promo.
4. The contractor uploads the estimate and an agent prefills the application.
5. Income verification through Plaid fails, and the product recovers instead of losing the homeowner.
6. The application goes to a mocked credit engine, which decides; the AI never does.

The demo shows one happy path and one friction case, the Plaid failure.

| # | Screen (Riverside three-column shell) | What happens | Where AI is used |
|---|---|---|---|
| 1 | **Compare options** | The contractor enters $30,000 and a priority (lower monthly payment, or lower total cost). Three catalog products appear side by side: monthly payment, total cost, APR, term and promo terms, with inline disclosures. | None. Code does the maths ($30K at 8% for 15 years = $286.70/month) |
| 2 | **Ask about this option** | A contextual question box next to the selected product: "What happens if I don't pay it off during the promo?" | The LLM answers from that product's terms only. Guardrails check every number against the computed values, block wording that implies approval, and attach the disclosures. |
| 3 | **Start application** | The contractor picks or uploads an estimate (text samples; a PDF only if time allows). An **application-prep agent** gathers the contractor profile, the selected product and the estimate fields, then lists what is still missing. | Extraction from a messy estimate, with each field showing its source and confidence. A bounded tool loop around a fixed skeleton. |
| 4 | **Verify income** (the homeowner's own step) | Synthetic Plaid Link. **Friction case:** the bank connection fails. The product explains in plain words what happened and offers the pay-stub path (mocked Plaid Document Income), so the homeowner isn't stuck. | Plain-language explanation of the exception and the next step. The AI never decides whether the income qualifies. |
| 5 | **Review and submit** | Prefilled fields, each with a source chip and confirmed by the homeowner; consents; submit to the mocked credit decision engine, which returns *pending* or *conditional*. | None. The decision is the engine's alone. |
| 6 | **Compliance audit** | Every borrower-facing message: inputs, product and catalog version, computed values, guardrail results, model, time. | — |
| 7 | **Where we'd take it next** | The historical baseline (what GoodLeap's 2023 flow already had), what this demo changes, and the roadmap by horizon, each item tied to a friction point and a metric. | — |

**Synthetic data:**
- A product catalog: fixed-APR products at 5, 10, 15 and 25 years, a 0% intro product and a deferred-interest promo.
- 2 contractor profiles.
- 3 estimates: clean, messy, and one missing its amount.
- Plaid responses: success, connection failure, and insufficient data.
- Pay-stub data for the document-income path.
- Credit engine outcomes.

Every synthetic file is labelled synthetic.

**Historical baseline claims** come from ChatGPT: the QuickLink guide dated 2023-02-23, the contractor iPad flow, and
ServiceTitan. They are unverified. Before the "Where we'd take it next" page cites them, I check each one against
its source. Anything I can't verify is labelled as unverified or dropped.

## Verification (D-7: general checks, not a test suite)

- **Fast gates:** type check and lint.
- **Payment maths:** a few unit tests (amortization, deferred-interest scenario).
- **Guardrails:** a small script that sends about 10 bad outputs and shows each one blocked.
- **End to end:** one scripted click-through of the happy path and the Plaid-failure path, with screenshots.

There is no frozen-test step, no per-ticket review loop and no eval suite.

## How the zero-to-hero stages run tonight (light mode)

| Stage | Tonight | Needs Innocent |
|---|---|---|
| §1 Frame | Brief audit + two-layer framing + PRD draft, built from the two ChatGPT turns' analysis | Sign-off |
| §2 Data reality | The synthetic data above + worked pairs WP-1…WP-4 (quote maths; question → guarded answer; estimate → prefill; Plaid failure → recovery) | Sign-off |
| §3 Hard problems | HP-1 orchestration (fixed skeleton + one bounded agent), HP-2 guardrails, HP-3 Plaid-failure recovery, HP-4 extraction that never guesses | Sign-off |
| §4 Interview | The open choices below, already asked here | PRD approval |
| §1–§4 review page | **One** combined review page instead of three | Proposed skip S-1 |
| UX-2 look sheets | None: Riverside's direction B, rebranded (D-6) | Recorded from D-6 |
| UX-3a contracts (OpenAPI + Prism mock) | Skip: one TypeScript types file shared by frontend and backend | Proposed skip S-2 |
| §5 Spikes | Not needed: no hard problem is uncertain enough | — |
| §6 Design | The brief's 2–3 page design doc *is* the design (architecture, AI decisions, compliance), plus a short code layout. Skip the signature check, spec dry run and Metz review. | Proposed skip S-3 |
| §7 Tickets | Skip GitLab tickets; one slice plan in `docs/plans/`, built directly by this session | Proposed skip S-4 |
| §8 Build | Build directly, general checks (D-7), one code review at the end instead of per ticket | Proposed skip S-5 |
| §9 Experiment | Skip the error-analysis round | Proposed skip S-6 |
| §10 Ship | README, design doc, `SUBMISSION.md` walk, roadmap page | — |

## Open choices

1. **Stack.** Recommended: Riverside's frontend (React 19, Vite, Tailwind 4) plus a small **TypeScript/Node**
   backend, matching the brief's stack ("TypeScript/Node.js backend"). The alternative is Riverside's Python backend.
2. **Model per role.** Recommended: Claude Sonnet 5.5 for the question box, extraction and the agent; the guardrail is
   rules plus the number check, with no second model.
3. **Deadline:** the exact time, and whether the 2–3 page design doc is part of tonight's work.

## Innocent's answers (2026-10-28 / 2026-10-29)

| Item | Answer |
|---|---|
| Stack | A — Riverside's React 19 + Vite + Tailwind frontend, TypeScript/Node backend ("whatever the briefing asked of us its looks like A") |
| Model | Claude Sonnet 5.5 for the question box, extraction and the agent ("yes") |
| Deadline | 08:00 CT 2026-10-29; the design doc is written after the build, drawing on the ChatGPT conversation |
| S-1, S-2, S-3 | yes |
| S-4 / S-5 | No tickets: major segments built in parallel, a code review per segment, broad verification |
| S-6 | skip |
| §1–§4 sign-off stops | build through; review the combined page in the morning |
