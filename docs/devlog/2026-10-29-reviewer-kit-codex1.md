# 2026-10-29 — Reviewer sample handoff

**Changed.** Created `docs/reviewer/README.md` and `docs/artifacts/goodleap-reviewer-kit.zip`, containing the guide
and byte-for-byte copies of the three existing synthetic estimate text files. Linked the handoff from the root
README, submission tracker and context router; updated the resume note. No application code changed.

**Why.** Innocent asked how to provide sample upload information to a reviewer. The kit supports actual `.txt`
estimate uploads, optional built-in sample selection, fictional identity entry and the two income journeys.
The guide makes clear that pay-stub recovery uses a canned result and does not accept a reviewer-supplied file.

**Checked.** Verified ZIP integrity and exact fixture bytes. Automated the actual upload control on the live
Render site for all three files, asserting the browser sent `estimateText` (not a built-in estimate ID): clean
roof total/deposit/financed = $30,000/$0/$30,000; messy roof = $30,000/$2,000/$28,000; missing-total HVAC leaves
all three amounts null and requiring input. Guide identity values match the existing browser smoke script.

**Publication.** Innocent requested adding the kit to the repository. Included the guide, ZIP and README/submission
links in the source-controlled handoff; added a direct download link and regenerated the archive from the same
canonical fixtures. Publication follows GitLab `origin/main` through its existing GitHub push mirror.

**Remaining.** No additional hosting or application changes are needed.
