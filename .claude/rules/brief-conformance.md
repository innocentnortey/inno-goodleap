> Local rule, written 2026-10-28 at Stage 0. Source: `docs/source/01-goodleap-brief.md` (ISSUED). Pattern from
> `inno-equinox/.claude/rules/brief-conformance.md`. The brief wins over this extract; correct this file against it.

# Brief conformance — the lines the submission never crosses

Project-wide. Read before drafting the PRD, the design doc, a prompt, a guardrail, UI copy or the README, and when
reviewing any of them. Quotes are the brief's words.

## Hard constraints (never traded away)

1. **No credit decision, stated or implied.** "No AI system can make or imply a credit decision." The AI never
   says or suggests that a homeowner qualifies, is approved or is likely to be; the existing credit decision engine
   decides. Prompts, guardrails and UI copy are checked for implied eligibility as well as explicit approval.
2. **Disclosures on borrower-facing communication.** "All borrower-facing communications must include required
   TILA/RESPA disclosures": loan terms, APR and total cost of credit (TILA); settlement costs and no kickbacks
   (RESPA). Woven in "without disrupting the experience" (rubric, *Design Taste*).
3. **Auditable.** "Every borrower-facing interaction needs to be auditable. I need to see exactly what the system
   said and why." Each borrower-facing output is recorded with its inputs and the source of every number.
4. **At least one guardrail that prevents non-compliant output** in the prototype.
5. **A real LLM API**; financial services are mocked ("You do not need to use real API keys for financial
   services (mock them)").
6. **Runnable locally**, with a root `README.md` that gets setup done "in under 5 minutes" and names every API key
   and environment variable.
7. **Deliverable shape:** a `/docs` folder with the 2–3 page design doc (PDF or Markdown) covering the six named
   sections; prototype code in the root or `/src`. A GitHub repo is preferred over a zip.
8. **Simplifying assumptions are called out explicitly**, and Innocent must be able to "explain every line".

## House practice that follows from them

- Payment amounts, APRs and totals come from deterministic code over the (mocked) product catalog, never from model
  text; the model may phrase them but a check verifies every number it outputs against the computed values.
- "Marketing language" that overpromises (guaranteed savings, "you'll qualify", "no risk") is treated as
  non-compliant output.

## Scope discipline

The brief recommends 1–2 hours and says a focused submission beats "a sprawling 3+-hour one". An addition that does
not serve a brief sentence is cut before any required deliverable slips (`hiring-partner-framing`).
