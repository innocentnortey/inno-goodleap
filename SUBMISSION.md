# Submission tracker — GoodLeap take-home

Every row is something the brief asks for, quoted from `docs/source/01-goodleap-brief.md`. Update a row when its
evidence lands; walk the whole table at each checkpoint. Status: ☐ not started · ◐ in progress · ☑ done (with
evidence).

**Due:** 08:00 CT 2026-10-29 (Innocent, PRD D-4). **Format:** "a single GitHub repository or zip file" (repo
preferred; commit history is "a useful (and positive) signal").

**Hosted demo:** <https://inno-goodleap.onrender.com> — real-model browser checks pass; financial services remain synthetic.

**Reviewer handoff:** [`docs/reviewer/README.md`](docs/reviewer/README.md) and
[`docs/artifacts/goodleap-reviewer-kit.zip`](docs/artifacts/goodleap-reviewer-kit.zip) (three uploadable text estimates,
fictional homeowner details and walkthroughs; no pay-stub upload required).

## Part 1 — Solution design document (2–3 pages, in `/docs`, PDF or Markdown)

| # | Brief asks for | Evidence | Status |
|---|---|---|---|
| D1 | Problem Framing & Approach — the problem, for whom, why this angle over others | `docs/design-doc.md` §1 | ☑ |
| D2 | Proposed Architecture — fit with the existing stack; models/APIs with vendor choices justified; data flow; integration | §2 (Sonnet 5.5 justified against Opus/Haiku/Bedrock, measured latency) | ☑ |
| D3 | AI Design Decisions — prompting vs fine-tuning, context window strategy, hallucination risk, evaluation and testing, out-of-scope handling | §3 (rung table, no RAG, number/quote checks, test counts) | ☑ |
| D4 | Compliance & Safety — auditability, no implied credit decisions, no non-compliant marketing language | §4 (guardrail chain, audit record, known limits) | ☑ |
| D5 | Rollout Plan — phases, MVP and time to ship, contractor change management | §5 (2-week MVP, 50-contractor pilot with a path to 15,000 per D-15, change management; SDQ-2…4 named as open) | ☑ |
| D6 | Monitoring & Impact Evaluation — business metrics, AI quality over time (drift, hallucinations, compliance failures), v1 → v2 feedback loop | §6 (north star 62% baseline, metric groups, golden-set loop) | ☑ |
| D7 | Length 2–3 pages | `docs/design-doc.pdf`: 3 pages (Letter, 10 pt) | ☑ |

## Part 2 — Working prototype

| # | Brief asks for | Evidence | Status |
|---|---|---|---|
| P1 | Uses at least one real LLM API | `claude-sonnet-5-5` for the question box, extraction, the prep agent and the bank-failure explanation (`apps/server/src/llm/client.ts`) | ☑ |
| P2 | A realistic end-to-end interaction connected to the scenario | $30K roof: compare → ask → agent prefill → Plaid failure recovery → engine result; `npm run smoke` | ☑ |
| P3 | At least one guardrail that prevents non-compliant output | `apps/server/src/guardrails/`; `npm run guardrail-check` blocks 16/16 crafted outputs | ☑ |
| P4 | Runs locally; root `README.md` with setup in under 5 minutes | `README.md` (npm install, one key, npm run dev) | ☑ |
| P5 | README names API keys and environment variables, and briefly describes the architecture | `README.md` tables and diagram | ☑ |
| P6 | Financial services mocked; simplifying assumptions called out explicitly | `data/synthetic/`, `apps/server/src/integrations/`; README *Simplifying assumptions* | ☑ |
| P7 | Code in the repo root or `/src`; design doc in `/docs` | `apps/`, `packages/` at the root; `docs/design-doc.md` | ☑ |

## What the reviewers grade (each dimension weighted equally)

| Dimension | Strong signal (brief) | Where we show it |
|---|---|---|
| Stakeholder Empathy | Contractor workflow, not just technology; the homeowner's emotional state | |
| Technical Depth | Specific model choices with reasoning; latency, cost, context limits; failure modes | |
| AI Ecosystem Fluency | LLM capabilities, embeddings, RAG, evaluation frameworks, guardrails tooling | |
| Pragmatism | MVP in days, build vs buy, tradeoffs acknowledged | |
| Design Taste | Natural conversational UX, graceful errors, disclosures woven in | |

## Ground rules to honour

- Innocent can explain every line of the submission.
- A focused 1–2 hour submission beats a sprawling 3+ hour one.
