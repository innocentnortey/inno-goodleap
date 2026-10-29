# Hard problems register (Stage 3, light mode)

Status vocabulary: **chosen** (Innocent's standing answers cover it) · **proposed** (Claude's recommendation, his to
overturn in the morning review) · **open**. Evidence pairs are in `docs/data/worked-pairs.md`.

## HP-1 · Orchestration: where the model has autonomy and where it doesn't — proposed

**Where it comes up:** every screen. **The problem:** the brief grades "conversational UX" and "AI ecosystem
fluency", Innocent rejected "just another chatbot", and the CTO wants nothing operationally fragile.
**Why it's hard:** too little AI reads as a calculator; too much reads as risk and slowness.

| Option | Shape | Consequence |
|---|---|---|
| A. Chat copilot runs the journey | One agent with tools drives every step | Easy to demo, slow for decisions, every borrower message needs guarding, Innocent's objection |
| **B. Fixed skeleton, AI at two seams** (recommended) | Screens and transitions are code; the model is called at SCR-2 (question), SCR-3 (extraction inside a bounded 6-step agent) and SCR-4 (exception explanation) | Each AI moment has a clear "why AI here"; the agent trace shows agentic behaviour without autonomy over navigation |
| C. No generated text | Extraction only; templates everywhere | Safest; weak on "conversational UX" and the guardrail requirement |

**Recommendation:** B (GP-72: draw the skeleton yourself; autonomy only where the path can't be known).
**Success measure:** a reviewer can name, for each screen, why AI is or isn't there; the agent trace never exceeds 6 steps.

## HP-2 · Guardrails that make borrower-facing text safe — proposed

**Where it comes up:** SCR-2 and SCR-4. **The problem:** "No AI system can make or imply a credit decision";
disclosures on every borrower communication; numbers must be right. **Why it's hard:** an LLM paraphrases numbers
and slips into reassurance ("you should be fine").

| Option | Consequence |
|---|---|
| Prompt instructions only | Fails silently; nothing to show Compliance |
| **Code checks, in order: number check → approval-language rules → disclosures attached by code; regenerate once, then safe template; every outcome logged** (recommended) | Deterministic, explainable, cheap; the list of blocked phrases is a known limit |
| Add a second-model classifier for implied approval | Better recall on subtle phrasing; another call, more latency; roadmap |

**Recommendation:** the code chain now; name the classifier as v2 on SCR-7. **Success measure:** `guardrail-check.ts`
blocks all crafted outputs; zero `shown` records contain an approval phrase or a number outside the allowed set.

## HP-3 · The friction case: recovering a failed income verification — chosen (D-13)

**Where it comes up:** SCR-4. **The problem:** income verification is one of the two biggest drop-offs although
Plaid exists. **Why it's hard:** we don't know *why* people drop (consent, connectivity, thin data); the brief is
silent, and a second income pipeline might duplicate Plaid Document Income.

**Chosen:** show the connection-failure path with a plain-words explanation and a document alternative, both mocked;
the AI explains, never judges income. **Rejected:** building pay-stub extraction as the headline feature.
**Success measure:** the friction path completes to `needs_review` income without a dead end; the explanation record
is in the audit log.

## HP-4 · Extraction that never guesses — proposed

**Where it comes up:** SCR-3. **The problem:** estimates differ across 15,000 contractors; a wrong amount in an
application is worse than a blank. **Why it's hard:** messy text (deposits in parentheses, "30 sq", missing totals).

**Recommendation:** tool-use with a JSON schema; every field carries a source quote and confidence; code validates
ranges and computes derived values (financed amount); below threshold → `needs_review`; missing → `needs_input`.
**Success measure:** WP-3's three estimates behave as specified; the HVAC estimate yields no invented total.

## Handled by default (no card)

- Payment maths: pure functions with unit tests (WP-1).
- Audit log: append-only JSONL with the §8 schema.
- Theme: Riverside direction B, rebranded (D-6).
- Hosting: none; local run per the brief.
- Secrets: `.env.example`, never committed.
- `docs/principles/system-design.md` questions: the demo has no load, peak or failure target of its own; the
  production versions of those questions are listed as SDQ-1…SDQ-5 in `docs/design/architecture.md` for the design doc.
