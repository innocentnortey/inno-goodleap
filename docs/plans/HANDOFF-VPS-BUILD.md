# Handoff: overnight build on the VPS

From the Mac session, 2026-10-29 about 00:30 CT. Innocent: "we're gonna do the building on the vps".

## Where things are

- **Working copy:** `claude-vultr:/home/linuxuser/workspaces/inno-goodleap`, copied from the Mac with `rsync`, `.git`
  and the git-ignored confidential sources included. The Mac copy is now a snapshot.
- **Git:** branch `main`, **no commits yet**. `origin` = `git@labs.gauntletai.com:innocentnortey/inno-goodleap.git`
  (private; it holds GitLab's README commit `6985087`, so the first push must build on it). Commit and push only
  when Innocent asks.
- **Model:** run the session on **Opus 5.5**, the same model as the Mac session (`~/.claude/rules/match-model-on-vps.md`).
  Planners use the session model; implementers and reviewers use Sonnet; the app calls `claude-sonnet-5-5`.
- **Keys:** `ANTHROPIC_API_KEY` is in `/home/linuxuser/workspaces/.env`. Run commands through
  `/home/linuxuser/workspaces/bin/with-provider-env`; never print the key.
- **Disk:** the VPS root is at 95% (4.7 GB free on 2026-10-29). Keep `node_modules` to one install; don't delete
  anything else without asking.

## Read first, in order

1. `CLAUDE.md` → `.claude/README.md` (router) → `.claude/state/resume.md`
2. `docs/prd/goodleap-prd.md` (v1.0: scope, R-n, C-n, decisions, acceptance §13), then `docs/analysis/2026-10-28-overnight-demo-plan.md` (the narrative and Innocent's answers)
2b. `docs/data/worked-pairs.md`, `docs/design/hard-problems.md`, `docs/ux/01-planning/USER_FLOWS.md`, `docs/ux/03-structure/SCREEN_SPECS.md`, `docs/design/architecture.md` §3 (modules and interfaces)
3. `docs/plans/slice-plan.md`: the stack, Foundation, segments A–D, the collision map, the end sequence
4. `.claude/rules/brief-conformance.md`: the lines the demo never crosses
5. `PROJECT-CHECKLIST.md` → *Skips*: what was skipped and Innocent's words for each

## First actions

1. Build Foundation (F) yourself. It's done when `npm run dev` serves the GoodLeap-branded shell and the type check
   passes.
2. Dispatch the A, B, C and D planners in one message, check their plans for collisions, then dispatch the
   implementers.
3. The combined §1–§4 review page already exists (`docs/artifacts/2026-10-29-goodleap-review.html`); refresh and re-stamp it only if a source changes.
4. Follow the slice plan's end sequence. Build done by about 06:30 CT; the design doc follows; deadline 08:00 CT.

Log milestones in `docs/devlog/` (a new run file for the VPS build). Keep `PROJECT-CHECKLIST.md` and `SUBMISSION.md`
current.
