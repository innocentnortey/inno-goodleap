# Nine-hour scope proposal

**Status: SUPERSEDED** by [`2026-10-28-overnight-demo-plan.md`](2026-10-28-overnight-demo-plan.md) the same evening. Kept as history. Was: **PROPOSED, UNDER REVISION.** Innocent challenged it on 2026-10-28: "This just seems like another chatbot,
which I don't know how it would actually close that gap … versus just a deterministic option-clicking UI." A
revised direction is awaiting his choice (AI behind a deterministic UI, reading documents). Drafted by Claude,
2026-10-28, for Innocent's decision at Stages 1–4. Inputs: the brief
(`docs/source/01-goodleap-brief.md`, ISSUED) and Innocent's ChatGPT conversation
(`docs/source/03-chatgpt-business-friction-analysis.md`, CONTEXT).

**Innocent's constraints (2026-10-28):**
- Build time is about **9 hours**.
- The app includes **a page showing where the project would have gone with more time**.

## The product in one sentence

A **contractor financing copilot**: a contractor in a homeowner's kitchen pastes or uploads the job estimate, sees
compliant monthly-payment options in seconds, answers the homeowner's questions in plain English, and hands off a
prefilled application draft. The AI never says or implies the homeowner is approved.

It joins the two halves of the ChatGPT conversation:
- the "can I afford it" objection, answered as the maths question "what would my payment be";
- the application prefill, with every field showing its source.

It cuts everything the conversation itself marked as integration work rather than AI work.

## The demo journey (one continuous flow)

Example input: an estimate reading *"Complete roof replacement, 2,400 sq ft, materials and labor included. Total: $30,000."*

1. **Estimate in.** The LLM extracts the project type, amount and scope into a typed object. Each field carries the
   quoted text it came from, and code validates the values (amount > 0 and within the $5K–$100K product range).
2. **Payment options.** Deterministic code computes payments over a **mocked product catalog** of 4–5 products: fixed
   APR at 5, 10, 15 and 25 years, a 0% intro product and a deferred-interest promo. The contractor sees the monthly
   payment, total cost and APR side by side. The model computes none of these numbers.
3. **Ask the copilot.** The contractor asks questions such as "What's the lowest monthly?", "What happens if they
   don't pay off the 0% plan in time?" or "Explain deferred interest simply". The LLM answers through tools that read
   the catalog and the computed scenarios.
4. **Guardrails on every borrower-facing message.** Each message passes three checks:
   - **Number check:** every dollar amount, percentage and term in the text must match a computed value.
   - **Credit-decision check:** a rule list plus a small classifier block wording such as "you'll qualify", "you're
     approved" or "guaranteed".
   - **Disclosures:** code attaches the APR, term and total cost of credit (TILA), and RESPA wording where it applies.

   If a check fails, the message is regenerated once. If it fails again, a safe template is shown, and the failure is
   logged.
5. **Prefilled application draft.** Each field shows where it came from:

   | Source | Fields |
   |---|---|
   | From the estimate | Project type and amount |
   | From the conversation | Preference for a lower monthly payment |
   | From the contractor profile (mock) | Contractor details |
   | Needs homeowner input | Name, address and identity |
   | Needs authorization | Income, via a placeholder Plaid step |

   No field is guessed silently, and nothing is submitted. The handoff to the credit engine is a mock.
6. **Compliance audit view.** Each borrower-facing message is stored with its inputs, product and catalog version,
   computed values, guardrail results and the model used. This answers the Head of Compliance's request: "exactly
   what the system said and why."
7. **"If we had more time" page.** See the section of that name below.

## Nine-hour budget

| Block | Hours | Done when |
|---|---|---|
| Scaffold, mocked catalog and contractor profile | 0.5 | App runs locally from one command |
| Payment maths: amortization, 0% intro, deferred interest, with tests | 1.0 | Worked-pair tests pass (e.g. $30K at 8% for 15 years = $286.70/month) |
| Estimate extraction, with source quotes and validation | 1.0 | 3 sample estimates, one of them messy, extract correctly |
| Copilot chat with tool calls | 1.0 | Answers cite computed scenarios only |
| Guardrails, plus a small eval set of 15–20 cases, including adversarial ones | 1.5 | Every injected bad output is caught; results table printed |
| Audit log and compliance view | 1.0 | Each message is traceable to its inputs and checks |
| Prefill draft screen | 1.0 | Every field shows its source and status |
| UX polish: disclosures woven in, error states | 1.0 | One clean run of the full journey |
| "If we had more time" page | 0.5 | Page renders from a roadmap data file |
| README (setup under 5 minutes), eval run, final pass | 0.5 | Fresh clone to running app in under 5 minutes |
| **Total** | **9.0** | |

Assumption: the 2–3 page design doc is written outside the 9 build hours. If it has to fit inside them, cut the
prefill screen first and show it on the "If we had more time" page as the next step.

## What is mocked or cut, and why

- **Mocked:**
  - The product catalog, contractor profile, credit engine and Plaid.
  - Reason: the brief says to mock financial services.
- **Cut:**
  - Pay-stub extraction, which is the back-office friction.
  - A homeowner-facing app.
  - Authentication, deployment and multiple languages.
  - Reason: none of them changes the core 30-second moment, and each one belongs on the roadmap page instead.

## "If we had more time" page: proposed content

Each item states the friction it addresses (from the brief), the metric it should move, and why it waited. The
items are grouped by horizon:

- **Next 2 weeks (pilot):**
  - Embed the copilot in the existing React partner portal.
  - Run a pilot with 25–50 contractors, measuring completion time (22 minutes against under 10) and abandonment
    (38%).
  - Raise a JSM ticket automatically when a guardrail fails.
- **Next quarter:**
  - Real Plaid income verification in the prefill flow, which targets the income-verification drop-off.
  - Pay-stub and scope-letter extraction for the manual review queue (friction 4).
  - A homeowner share link with the scenario and disclosures.
  - Product suggestions ranked from Snowflake funnel data.
- **Later:**
  - Hands-free voice mode for job sites, and Spanish.
  - Compliance sampling dashboards, drift and hallucination monitoring, and a v1 → v2 feedback loop built from
    flagged conversations.

This page also covers three things the brief asks for:
- the design doc's rollout plan and its "feedback loop between v1 and v2";
- "judgment about what to build vs. what to mock";
- calling out simplifying assumptions.

## Risk to state openly

The brief recommends 1–2 hours and warns that "a focused, well-thought-out 1-2-hour submission is better than a
sprawling 3+-hour one." Nine hours is fine if the result still looks focused: one journey and one clear hypothesis,
with extra time spent on correctness, guardrails and evals rather than more features. The README and design doc
should say how the time was spent.

## Open choices for Innocent (asked at Stages 3–4, not decided here)

1. **Stack.** TypeScript/Node, which matches GoodLeap's stack, or Python.
2. **Model for each role:** chat, extraction, and the guardrail classifier.
3. **Prefill scope.** Keep it in the 9 hours, or move it to the roadmap page.
