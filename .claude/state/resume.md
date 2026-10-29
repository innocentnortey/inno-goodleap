# Resume note — inno-goodleap

**Phase.** Prototype built; Innocent requested VPS synchronization and Render deployment on 2026-10-29.
Mac and `claude-vultr:/home/linuxuser/workspaces/inno-goodleap` are reconciled. GitLab `origin/main` is canonical;
the approved public GitHub push mirror is live. Confidential source files remain ignored.

**Deployment.** Production Docker image builds and runs on the VPS, with the built frontend and API on one port,
non-root runtime, production dependencies, and persistent audit storage. Full checks pass (113 tests), real-model
smoke passes all 12 steps, and audit records survive restart. Configuration and release steps:
[deployment](../../docs/deployment.md); verification record: [deployment log](../../docs/devlog/2026-10-29-render-deployment-codex1.md).

**Deployed.** <https://inno-goodleap.onrender.com>, Render `srv-dbhfkbpsrm7s73fni49g`, Ohio Starter + 1 GB disk.
Innocent approved the additional $7.25/month on 2026-10-29. The dedicated environment group is linked; the public
12-step real-model smoke run passes, and all five audit records survived a Render restart byte-for-byte.
GitLab push mirror → GitHub main → Render auto-deploy is enabled. Operational details live in
[deployment](../../docs/deployment.md).

**Reviewer handoff.** The reviewer kit is included in the repository: [guide](../../docs/reviewer/README.md) and
[ZIP](../../docs/artifacts/goodleap-reviewer-kit.zip). It includes the three canonical `.txt` estimate fixtures,
fictional homeowner details and both demo walkthroughs. All three actual file uploads were verified against the
live application. The pay-stub step is a built-in simulation and requires no supplied document.

**Next action.** Share the public demo and [reviewer guide](https://github.com/innocentnortey/inno-goodleap/blob/main/docs/reviewer/README.md),
which links to the downloadable sample kit; submit the GitHub repository.

**Other open items.** Innocent's review of the combined review page and the overnight build decisions (INTRO-0
ranking and rounding); SDQ-2…4 (peak concurrency, failure to survive, production spend ceiling). Submission status
and stage gates live in [SUBMISSION.md](../../SUBMISSION.md) and [PROJECT-CHECKLIST.md](../../PROJECT-CHECKLIST.md).
