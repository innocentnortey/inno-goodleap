# Angle and demo framing — two layers of success

Rule: `hiring-partner-framing`. Sources: brief (ISSUED), brief audit, PRD §2. Quotes are the brief's words.

## Layer 2: why the partner wrote the brief

> "If we can get contractors to close 10% more deals by making financing easier to explain, that's worth $200M in annual origination volume." — VP of Contractor Partnerships

> "I'm standing in someone's kitchen trying to close a $30K roofing deal. I need to be able to tell them in 30 seconds what their monthly payment would look like." — Contractor

The lender makes money when a contractor's sale becomes a funded loan. The sale is lost at the kitchen table when financing is confusing, and the loan is lost later when the application stalls (38% abandonment, at product selection and income verification).

## Layer 1: what the brief asks us to prove

A design doc and a prototype showing an AI-assisted interaction that is **compliant** (no implied credit decision, TILA/RESPA disclosures, auditable), **pragmatic** (mock the financial services, one real LLM, runnable in 5 minutes) and shows **judgment** about where AI belongs.

## Metrics tree

| Level | Metric | Why the partner cares (quote) | How the system produces it | Caveat we state |
|---|---|---|---|---|
| **North star** | Application completion rate (completed ÷ started, weekly, by contractor segment and product) | "Application abandonment rate is 38%" | Portal funnel events already in Snowflake [B]; the demo logs step events | Baseline 62% is the brief's figure; the demo cannot measure a lift |
| Revenue | Originated volume | "$200M in annual origination volume" | Credit engine + servicing, not ours | Volume ≠ revenue; margins unknown |
| Leading | Drop-off at product selection | "biggest drop-offs … loan product selection" | Step events on SCR-1/SCR-2 | — |
| Leading | Recovery rate after a failed Plaid link | "income verification" is the other drop-off | SCR-4 events: failed → document path → verified | Mocked in the demo |
| Leading | Share of prefilled fields kept unchanged | "manual review of uploaded documents" | SCR-5 edit events vs `PrefillField.source` | — |
| Leading (paired) | Questions asked per session × share answered without the safe template | "quality of the conversational UX" | Audit log `outcome` | Engagement counts only with quality |
| Health | Guardrail blocks per 100 messages, by check | "every borrower-facing interaction needs to be auditable" | Audit log | A spike = prompt or catalog drift |
| Health | Answer latency p95 | "30 seconds" | Timer in the audit record | Target ≤ 5 s is our assumption |
| Hard gate | Compliance failures shown to borrowers | "No AI system can make or imply a credit decision" | Any `shown` record that fails a later review | Must be zero |

**Best objection:** "Completion can rise because you pushed unqualified people into applying." **Answer:** the credit engine still decides; decline rate is reported beside completion; the AI never implies approval, and the audit log proves it.

## Success surface in the product

SCR-6 (Compliance audit) is the health surface. The value metrics are described on SCR-7 as what a pilot would measure; the demo does not fake a dashboard of invented numbers (`business-metrics` rule 4).

## Demo script order (for the morning walkthrough and any video)

1. **Problem in the partner's words**: the contractor quote and the VP's number.
2. **What success means**: more started applications completing, with zero compliance failures.
3. **The flow, narrated by the thing the partner cares about**: $30,000 roof → three options in seconds → the homeowner's hard question answered safely → the estimate read by the agent → the Plaid failure that would have been an abandonment, recovered → submitted to the engine, which decides.
4. **The success surface**: the audit record for the answer just given.
5. **Decisions, cuts, candour**: buttons not chat; mocked services; what we did not build and why (SCR-7).

## Interview answers (two-layer shape)

| Likely question | Layer 2 (business) | Layer 1 (what we built, the alternative, the limit) |
|---|---|---|
| Why not just a calculator? | A calculator existed in 2023 [C]; drop-off is about understanding | Deterministic compare + a guarded question box; alternative was a chat copilot (rejected: slower, riskier); limit: we can't measure comprehension in a demo |
| Why not a chatbot for the whole application? | Chat is slower than buttons for decisions | AI only where input is ambiguous or unstructured; alternative was full conversational intake; limit: fewer "AI moments" on screen |
| Why mock Plaid instead of fixing it? | Plaid exists; the gap is recovery, not connectivity | Friction case = failed link → explanation → document path; alternative was a second income-extraction pipeline (rejected: may duplicate Plaid Document Income) |
| How do you stop it making a credit decision? | Compliance's "see exactly what it said and why" | Three code checks, regeneration then safe template, audit record per message; limit: rule list + number check, no classifier yet |
| Why no RAG or fine-tuning? | CTO: "don't give me a science project" | Terms fit in context; prompt + tools; limit: a 500-product catalog would need retrieval (roadmap) |
