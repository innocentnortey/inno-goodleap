# 2026-10-29 — VPS sync and Render preparation

**Changed.** Reconciled Mac and VPS (same starting commit `5994f0d`, identical working-tree content). Added
production HTTP configuration, a shared app factory, Docker packaging, Render definition, deployment documentation,
and ten production hosting tests. Moved `tsx` into server runtime dependencies and excluded development tools
from the runtime image. Preserved the existing GitHub mirror approval and updated context routes/status.

**Why.** Innocent requested synchronization with the VPS and deployment on Render. Development previously bound
only to loopback and did not serve the built web app. Audit data needs a persistent disk on Render.

**Checked.** VPS: typecheck and lint pass; 113/113 tests; guardrail checks block all 16 bad outputs and accept both
good ones. Docker build succeeds. Real-model browser smoke against the container passes all 12 steps, with no
console errors. Three audit records remain after container restart. Production dependency audit has zero known
vulnerabilities; development-only Vitest retains three advisories and is absent from the runtime image. Visually
checked the production compare-screen screenshot. GitLab's repository settings show the GitHub push mirror and
its successful update. Root build context allowlist excludes secrets and confidential source documents.

**Remaining.** Incremental hosting cost confirmation requested ($7/month Starter + $0.25/month 1 GB disk,
excluding usage/model calls), as required by `.claude/rules/gauntlet-hosting-default.md`. Then create the dedicated
Render service/environment group, verify mirrored release SHA, and run the public smoke journey.

## Hosting approved and created

**Changed.** Innocent approved the additional $7.25/month on 2026-10-29. Created Render Docker web service
`srv-dbhfkbpsrm7s73fni49g` in Ohio on Starter, with 1 GB audit disk `dsk-dbhfkbpsrm7s73fni4qg` and dedicated
environment group `evg-dbhfkbm7bikc73egtmg0`. Transferred only the VPS provider credential into the group's
`ANTHROPIC_API_KEY` without printing or committing its value. Auto-deploy follows mirrored GitHub `main`.

**Checked.** Render confirms plan, region, disk and group link. First deployment serves the homepage and
returns 404 for `.env`, design documents and unknown API routes. A subsequent deployment activates the
newly linked environment group (the initial deployment captured configuration before the group was linked).

**Remaining.** Public real-model smoke and audit persistence verification; final source synchronization.

## Public release verified

**Changed.** Live demo: <https://inno-goodleap.onrender.com>. Added its link to the README and submission tracker;
recorded the approved recurring spend, service identifiers, operating instructions and current resume state.

**Checked.** Release `c606aeb` live on Render. Public browser smoke passes all 12 steps with the real model and no
console errors. Homepage, JS and CSS load successfully; sensitive paths return 404. Health reports the real
release SHA and `llmKey: true`. Render restart completed (new process startup in logs at 07:51:33 UTC); all five
audit records were retained byte-for-byte (SHA-256 `7aed80f2f3d06622ea57c083c294d0ca8a272b5e6ea31e4f0e1ab013291d8e95`).
The production compare screenshot was visually inspected. No application changes followed the successful smoke.

**Remaining.** No deployment work remains. The existing review/sign-off questions are unchanged in the submission
and stage trackers. This documentation update flows through the same approved mirror and deployment path.
