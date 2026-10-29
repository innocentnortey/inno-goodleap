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
- **GitHub is not approved yet.** The brief prefers "a single GitHub repository" for the submission. A GitHub
  mirror of GitLab (as Cerbo had) needs Innocent's explicit yes; never add a GitHub `origin`.
- **Commit and push only when Innocent asks**, except in factory mode (published tickets running through the build
  loop), which has standing authorization to push to `origin`.
- **Confidential sources stay out of git.** `docs/source/` verbatim copies and `originals/` are git-ignored; the
  register `docs/source/README.md` is tracked.

SSH setup, the port-22022 gotcha and troubleshooting: `Gauntlet AI/.claude/rules/gauntlet-gitlab-versioning.md`.
