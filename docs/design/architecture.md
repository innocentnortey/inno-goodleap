# Architecture note (demo build) and the questions the design doc still owes

Stage 6 is skipped (S-3): this note replaces DO-1…DO-7 with the minimum the build needs and lists what the 2–3 page
design doc must still answer. Rules: `code-design-solid-modularity`, `system-design-questioning`.

## 1. System map (what runs where, in the demo)

```
Browser (React 19 + Vite + Tailwind 4)  ──/api──▶  Node + TypeScript (Hono)  ──▶  Anthropic API (claude-sonnet-5-5)
  7 screens, Riverside shell                     │
                                                 ├─▶ finance/       pure maths (no I/O)
                                                 ├─▶ guardrails/    pure checks + disclosure attach
                                                 ├─▶ assist/        prompt + tool loop for SCR-2
                                                 ├─▶ application/   extraction + prep agent
                                                 ├─▶ integrations/  Plaid · document income · credit engine · contractor profile  (all canned JSON)
                                                 └─▶ audit/         append-only var/audit.jsonl
```

In production (design doc): the same modules behind the existing partner portal's TypeScript/Node backend on ECS;
RDS Postgres for audit records, S3 for documents, SQS for extraction jobs; the real product catalog, Plaid, document
management and credit engine APIs replace `integrations/` one adapter each [B].

## 2. One request traced (SCR-2, "what happens if I don't pay it off in 18 months?")

1. Browser → `POST /api/ask {productId, amount, question}` (≈ 1 KB); the server recomputes the scenario itself and never trusts client numbers.
2. `assist/` loads the product terms (catalog) and the computed scenario (`finance/`), builds the prompt (version `ask-v1`), calls the model with `max_tokens 400` at effort `low`. Budget ≈ 2–4 s.
3. `guardrails/` runs check 1 (numbers ⊆ allowed set), check 2 (approval-language rules), check 3 (attach disclosures). ≈ 5 ms. On failure: one regeneration with the reason (another 2–4 s), then the safe template.
4. `audit/` appends the record (raw, checks, final, latency). ≈ 1 ms.
5. Response → browser renders the answer card. Target p95 ≤ 5 s [A]; the timer on screen makes it visible.

## 3. Modules and the seams that pay (SOLID, time-boxed)

| Module | One-sentence job | Interface | Depends on | Seam |
|---|---|---|---|---|
| `finance` | Turn (amount, product) into a `Scenario` with exact numbers | `quote(amount, catalog, priority): Scenario[]`, `scenarioFor(amount, product)` | nothing | **cut**: pure core, unit-tested |
| `guardrails` | Decide whether a borrower-facing text may be shown, and finish it | `guardedGenerate({purpose, prompt, context, allowedNumbers, disclosures}, llm): GuardedAnswer`; `runChecks(text, policy, allowedNumbers, disclosures): GuardrailCheck[]` | `LlmClient` interface | **cut**: policy (phrase list, tolerance) in `guardrails/policy.ts`, mechanism in `guardrails/index.ts` |
| `assist` | Answer one question about one product | `ask(req): GuardedAnswer` | `finance`, `guardrails`, catalog | — |
| `application` | Prepare an application from an estimate, a profile and a scenario | `prepare(req): PreparedApplication` (agent) · `extractEstimate(text): Extraction` (tool) | `LlmClient`, `integrations` | **cut**: extraction behind a tool so the agent loop is testable with a fake |
| `integrations` | Stand in for external systems with canned data | `PlaidClient`, `DocumentIncomeClient`, `CreditEngineClient`, `ContractorProfileClient` interfaces + `*Mock` classes | JSON files | **cut**: one adapter per external system; the real ones are a file each later |
| `audit` | Record every borrower-facing message | `append(record)`, `list()` | filesystem | **deferred**: a `Store` interface is one line when Postgres arrives |
| `llm/client` | The only file that imports the Anthropic SDK | `LlmClient { complete(), toolLoop() }` | SDK | **cut**: dependency inversion; tests use `FakeLlm` |

Not cut: a generic "agent framework", a prompt registry, a retrieval layer. One agent, two prompts, terms in context.

## 4. Where AI is and isn't (the sentence for the interview)

AI reads the estimate, explains one product's terms, and explains an exception. Code computes every number, attaches
every disclosure, decides every state transition, and the credit engine decides credit. The guardrail is code; the
model never sees homeowner identity or income values.

## 5. Questions the design doc must answer, and who answers them

Per `system-design-questioning.md` these are Innocent's, not defaults. The demo needs none of them; the production
sections of the design doc do. **Ask in the morning before writing §2, §5 and §6 of the design doc.**

| ID | Question | Recommendation to put beside it |
|---|---|---|
| SDQ-1 (SD-3.1) | What load is the design written for: how many contractor sessions a day across the 15,000 partners, and what larger load needs a written path? | **Decided 2026-10-29 (Innocent, "yes"; PRD D-15):** pilot of 50 contractors; written path to all 15,000 |
| SDQ-2 (SD-3.4) | Peak concurrency: how many question-box calls at the same moment (Saturday mornings?) | Size from SDQ-1 × a stated peak factor |
| SDQ-3 (SD-7.2) | What failure must the production deployment survive? | One AZ; the audit store is the thing that must never lose a record |
| SDQ-4 (SD-1.6) | Spend ceiling for model calls per application and hosting | State a per-application model cost cap |
| SDQ-5 (SD-1.9) | The hardest uncertainty: comprehension lift, or guardrail recall on subtle implied-approval wording? | Guardrail recall; propose the classifier + sampling review in v2 |

Until answered, the design doc's rollout and monitoring sections describe *what* would be measured, not sized numbers.
