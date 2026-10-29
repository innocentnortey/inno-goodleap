# GoodLeap deployment

Requested by Innocent on 2026-10-29. Render follows the project's Gauntlet hosting default.

## Configuration

- Service: `inno-goodleap`, Docker web service, Ohio, one Starter instance.
- Repository: <https://github.com/innocentnortey/inno-goodleap>, branch `main`.
- Source of truth: GitLab `origin`. Its existing push mirror publishes to GitHub; never push to GitHub directly.
- Definition: root `Dockerfile`, `.dockerignore`, and `render.yaml`.
- HTTP: production binds to `0.0.0.0:$PORT`, serves `/` and `/assets/*` from `apps/web/dist`, and keeps `/api/*` as JSON.
- Health check: `/api/health`. `llmKey: true` means a credential is present; the real-model smoke run verifies calls work.
  `version` reads Render's `RENDER_GIT_COMMIT` to identify the deployed revision.
- Secret: `ANTHROPIC_API_KEY` in the dedicated `inno-goodleap-production` Render environment group.
- Audit: 1 GB persistent disk at `/data`, `AUDIT_PATH=/data/audit.jsonl`. Local VPS audit history is retained on the VPS;
  the hosted demo starts a separate audit log. In-memory applications reset when the process restarts.
- Runtime: Node 24, unprivileged `node` user, production dependencies only. Confidential documents and local credentials
  are excluded from the Docker build context and image. Financial integrations remain synthetic demo fixtures.
- Expected additional hosting: $7/month instance + $0.25/month disk, excluding usage and model calls. Paid creation
  awaits confirmation under the repository's hosting spend rule.

## Release and verification

1. Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run guardrail-check`, and `npm run build`.
2. Build and start the Docker image with the provider key supplied at runtime. Run `WEB_URL=<container-url> npm run smoke`.
3. Commit and push to GitLab `origin/main`; verify the GitHub mirror reaches the same commit.
4. Link the dedicated environment group, configure the persistent disk, and deploy on Render.
5. Verify the live homepage, assets, health, real-model smoke journey, and audit retention after restart.

Persistent disks allow one instance and a short interruption during deploys. Restore a previous working commit by
reverting on GitLab and allowing the mirror and Render to deploy it. The disk retains audit records.

## Current status

Mac and VPS copies reconciled. Container build, 113 tests, typecheck, lint, guardrail checks (16 bad blocked / 2 good accepted),
and the 12-step real-model production smoke run pass. All three smoke audit records survived a container restart.
Production dependency audit reports zero known vulnerabilities; the development-only Vitest dependencies retain
three advisories and are excluded from the runtime image. The compare-screen screenshot was visually checked.
Render service creation awaits the incremental hosting cost confirmation. No service has been created yet.
