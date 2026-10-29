# ICM progress checklist
Tracks context-system maturity only; product work and status live in [PROJECT-CHECKLIST.md](../../PROJECT-CHECKLIST.md)
and [SUBMISSION.md](../../SUBMISSION.md). Made by invoking `icm-project` **1.6.1** (Phases 1 and 3), 2026-10-28.
Update the affected row in the same task as the change, with an evidence link.
Status: pending (names its unblocking event) · provisional · established · verified · n/a (reason).

| Milestone | Status | Evidence / owner | Next check — enabled by |
|---|---|---|---|
| Work home, sources and owners located | established | Mac and VPS copies reconciled 2026-10-29; GitLab `origin/main` is canonical, GitHub push mirror live; [deployment](../../docs/deployment.md) | Render release verification |
| Purpose, audience and domain meaning (representative task) | provisional | Brief + [ChatGPT conversation](../../docs/source/03-chatgpt-business-friction-analysis.md): contractor quoting a $30K roof needs a monthly payment in 30 s, no implied approval | Brief audit and PRD signed at Stage 1 |
| Environment, tools and collaboration | provisional | Mac working copy; real LLM API needed (key not yet chosen); stack not chosen; deadline unknown | Stack and model decided at Stages 4–6; deadline from Innocent |
| Blueprint and first delivery step | pending | — | PRD approved (Stage 4) and design (Stage 6) |
| Entry → router → maintenance instruction | established | [CLAUDE.md](../../CLAUDE.md) → [router](../README.md) → [maintenance rule](../rules/context-maintenance.md); `check_context.py` run 2026-10-28 | Re-run at every gate |
| Fresh-context route walkthrough | provisional | 2026-10-28: "audit the brief" resolves entry → router → brief, rules, output path; output paths are planned | Stage 1 artifacts exist at the routed paths |
| Code design: planned locations | pending | — | Stage 6 writes `.claude/reference/area-map.md` |
| Physical scaffold | pending | — | First scaffold after Stage 6 |
| Routes verified against code and tests | established | [Deployment route](../../docs/deployment.md), `apps/server/test/hosting.test.ts` (10 production boundary checks), existing 103 tests | Live Render smoke verification |

Last reconciled: 2026-10-28 — Stage 0 bootstrap ([dev log](../../docs/devlog/2026-10-28-stage-0-scaffold-s0.md)).
