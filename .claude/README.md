# Router — inno-goodleap

Maps a request to what it should read and where its output goes. Rows link; owners hold the content. Paths marked
*(planned)* do not exist yet.

**Common context for every task:** [maintenance rule](rules/context-maintenance.md) ·
[ICM progress checklist](state/icm-progress.md) · [PROJECT-CHECKLIST.md](../PROJECT-CHECKLIST.md) (current stage) ·
[resume note](state/resume.md).

**Do not load by default:** `docs/principles/` in full (open the one file a rule cites), the PDF originals in
`docs/source/originals/`, and the hiring-partner-framing rule's demo-video section until Stage 10.

## Routes

| Request | Read | Output goes to | Done when |
|---|---|---|---|
| Audit the brief (Stage 1) | [brief](../docs/source/01-goodleap-brief.md), [ChatGPT notes](../docs/source/03-chatgpt-business-friction-analysis.md), [brief-conformance](rules/brief-conformance.md), [problem-framing](rules/problem-framing.md) | `docs/analysis/YYYY-MM-DD-brief-audit.md` | Opens with the problem behind the brief |
| Two-layer framing and metrics tree (Stage 1) | [hiring-partner-framing](rules/hiring-partner-framing.md), [business-metrics](rules/business-metrics.md) | `docs/delivery/YYYY-MM-DD-angle-and-demo-framing.md` | North star named with baseline or "no baseline" |
| Draft the PRD (Stage 1, approved at Stage 4) | brief audit, framing, [problem-framing](rules/problem-framing.md) | `docs/prd/goodleap-prd.md` | Every brief requirement mapped |
| Stage 1–3 review pages | [html-files-not-artifacts](rules/html-files-not-artifacts.md); zero-to-hero `references/visual-review-pages.md` | `docs/artifacts/` | `check_review_page.py` passes |
| Data reality: sample estimates, products, worked pairs (Stage 2) | [synthetic-test-data](rules/synthetic-test-data.md) | `docs/data/` | 3 worked pairs (light mode) |
| Hard problems and the interview (Stages 3–4) | [agent-architecture](rules/agent-architecture.md), [system-design-conversation](rules/system-design-conversation.md) | `docs/design/hard-problems.md` | Innocent signs the gate in the checklist |
| The 2–3 page design doc (the brief's Part 1) | [brief-conformance](rules/brief-conformance.md), [design-doc-defense](rules/design-doc-defense.md), [verification-evals-observability](rules/verification-evals-observability.md), [agent-tools](rules/agent-tools.md), [retrieval-and-context](rules/retrieval-and-context.md) | `docs/design-doc.md` (PDF render `docs/design-doc.pdf`) | Covers the brief's six sections in ≤ 3 pages |
| Remote, commit, push | [project-provenance](rules/project-provenance.md) | GitLab `origin` *(planned)* | Visibility checked private |
| Read what is being built | [PRD](../docs/prd/goodleap-prd.md), [worked pairs](../docs/data/worked-pairs.md), [hard problems](../docs/design/hard-problems.md), [flows](../docs/ux/01-planning/USER_FLOWS.md), [screens](../docs/ux/03-structure/SCREEN_SPECS.md), [architecture](../docs/design/architecture.md) | — | — |
| Build the overnight demo (segments F, A–D) | [handoff](../docs/plans/HANDOFF-VPS-BUILD.md), [slice plan](../docs/plans/slice-plan.md), [brief-conformance](rules/brief-conformance.md) | `apps/` (web, server), `packages/shared/`, `data/synthetic/`, `scripts/` | `npm run typecheck`, `lint`, `test`, `guardrail-check`, `smoke` pass |
| Tickets and build (Stages 7–8) | [ticket-lanes](rules/ticket-lanes.md), [build-loop-test-scope](rules/build-loop-test-scope.md), [code-design-solid-modularity](rules/code-design-solid-modularity.md) | `docs/plans/` | Per the checklist |
| Hosting (only if a deployed demo is wanted) | [gauntlet-hosting-default](rules/gauntlet-hosting-default.md) | — | The brief asks only for a local run |
| Log a meaningful outcome | [dev log index](../docs/devlog/README.md) | `docs/devlog/YYYY-MM-DD-<topic>-<run-id>.md` | Changed / Why / Checked / Remaining written |

**Unmapped or ambiguous task:** read the brief and the checklist's current gate, ask Innocent if the meaning is a
genuine choice, then add a row here once it is resolved.

## Review pages (source → page)

| Stages 1–4 combined (S-1) | brief audit, framing, PRD, data, hard problems, UX files, architecture → `../docs/artifacts/2026-10-29-goodleap-review.html` |
