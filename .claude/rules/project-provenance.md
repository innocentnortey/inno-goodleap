> Adapted from: `Gauntlet AI/.claude/rules/gauntlet-gitlab-versioning.md`, inspected 2026-10-28. That rule asks spin-off
> repos to carry the policy in a short rule and link to it for the SSH mechanics; this is that short rule.

# Project provenance and version control

Project-wide. Applies to every task that adds a remote, commits or pushes.

- **Greenfield.** No upstream starter; nothing is forked.
- **`origin` is Gauntlet's GitLab:** `git@labs.gauntletai.com:innocentnortey/inno-goodleap.git` (SSH port 22022).
  Created by Innocent 2026-10-28; added as `origin` and SSH verified the same day. The remote holds GitLab's
  `Initial commit` `6985087` (`README.md`); the first push must build on it (fetch, then rebase or merge), never force.
- **Not public** (unauthenticated API returned 404, 2026-10-28). Re-check before the first push: the brief is
  confidential, and two earlier projects were public on creation (YourAI, Newsela).
- **GitHub mirror approved 2026-10-29** (Innocent gave `github.com/innocentnortey/inno-goodleap.git`, ~02:20 CT). The
  GitHub repo is **public** and mirrors GitLab `main` (same history, `5994f0d` on 2026-10-29). It is the submission
  URL the brief prefers. Never add it as `origin` and never commit to it directly: GitLab is the source of truth and
  the mirror carries changes out (`gauntlet-hosting-default`, *Deployment flow*). Confidential sources stay
  git-ignored, so they are absent from the public tree (checked 2026-10-29: only `docs/source/README.md` is tracked).
- **Commit and push only when Innocent asks**, except in factory mode (published tickets running through the build
  loop), which has standing authorization to push to `origin`.
- **Confidential sources stay out of git.** `docs/source/` verbatim copies and `originals/` are git-ignored; the
  register `docs/source/README.md` is tracked.

SSH setup, the port-22022 gotcha and troubleshooting: `Gauntlet AI/.claude/rules/gauntlet-gitlab-versioning.md`.
