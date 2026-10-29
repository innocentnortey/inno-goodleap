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
