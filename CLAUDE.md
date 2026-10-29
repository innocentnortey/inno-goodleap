# GoodLeap: Home Improvement Loan Assignment — project entry

## What this project is
Innocent's submission for a hiring-partner take-home (via Gauntlet AI) for an **AI Solutions Engineer** role at a
home-improvement lender, taken to be GoodLeap. The lender's contractors lose deals because financing is slow and
hard to explain on site: applications take 22 minutes (benchmark under 10) and 38% are abandoned. The submission is
two things: a **2–3 page solution design doc** in `docs/` and a **working prototype** that runs locally, calls a real
LLM API, and has at least one guardrail against non-compliant output. Financial services are mocked. The stack is
not chosen yet; the brief's environment is TypeScript/Node on AWS with Anthropic and OpenAI available.

## Non-negotiable boundaries
- **The brief is the requirement owner and is confidential.** Never contradict it; keep its verbatim copies out of git. Register: [docs/source/README.md](docs/source/README.md); rule: [project-provenance](.claude/rules/project-provenance.md).
- **No AI output makes or implies a credit decision.** The brief says so outright; the AI explains, the existing credit engine decides. Rule: [brief-conformance](.claude/rules/brief-conformance.md).
- **Borrower-facing text carries TILA/RESPA disclosures and is auditable** ("exactly what the system said and why"). Numbers come from deterministic code, never from the model. Rules: [brief-conformance](.claude/rules/brief-conformance.md), [verification-evals-observability](.claude/rules/verification-evals-observability.md).
- **Find the real problem before framing the solution.** Rules: [problem-framing](.claude/rules/problem-framing.md), [business-metrics](.claude/rules/business-metrics.md), [hiring-partner-framing](.claude/rules/hiring-partner-framing.md).
- **Follow the zero-to-hero stages in order**; no design doc, tickets or feature code ahead of their gate. Record: [PROJECT-CHECKLIST.md](PROJECT-CHECKLIST.md).
- **HTML pages are local files in `docs/artifacts/`, never published.** Rule: [html-files-not-artifacts](.claude/rules/html-files-not-artifacts.md).
- **Ask before system-design choices that depend on Innocent's answers.** Rule: [system-design-questioning](.claude/rules/system-design-questioning.md).

## Read only what the task needs
**Start at the router: [`.claude/README.md`](.claude/README.md).** These are ordinary links, not imports.

| Task | Read |
|---|---|
| Which document wins a disagreement | *How this project is governed* below |
| Understand the brief or audit it | [brief](docs/source/01-goodleap-brief.md), then [problem-framing](.claude/rules/problem-framing.md) |
| Use Innocent's earlier thinking | ChatGPT conversation [part 1](docs/source/03-chatgpt-business-friction-analysis.md) and [part 2, which sets the direction](docs/source/04-chatgpt-product-direction.md) (context, not requirements) |
| Draft the design doc | [PRD](docs/prd/goodleap-prd.md), [architecture note](docs/design/architecture.md), [design-doc-defense](.claude/rules/design-doc-defense.md), [agent-architecture](.claude/rules/agent-architecture.md) |
| Start or resume work | [`.claude/state/resume.md`](.claude/state/resume.md), then [PROJECT-CHECKLIST.md](PROJECT-CHECKLIST.md) |

## How this project is governed
Entry points **route**, rules **prohibit**, references **explain**, canonical documents **prove**.

| Concern | Owner |
|---|---|
| Where anything is, what to load | [router](.claude/README.md) |
| How to keep context true while working | [maintenance rule](.claude/rules/context-maintenance.md) — read on any task that moves code or an owner |
| Context-system maturity | [ICM progress checklist](.claude/state/icm-progress.md) |
| Requirements | [the brief](docs/source/01-goodleap-brief.md) (ISSUED); [our PRD](docs/prd/goodleap-prd.md) (v1.0) |
| Stage, gates and sign-offs | [PROJECT-CHECKLIST.md](PROJECT-CHECKLIST.md) |
| What the reviewer receives | [SUBMISSION.md](SUBMISSION.md) |
| Where we left off | [`.claude/state/resume.md`](.claude/state/resume.md) |
| Run history | [dev log](docs/devlog/) |
| Which document wins a disagreement | the brief → Innocent's recorded decisions (PRD decision table) → our PRD and design docs → context sources ([register](docs/source/README.md)) |
