---
stage: "plan"
title: "plan"
at: "2026-09-30T18:36:07.733Z"
cost: 0.5544568000000001
turns: 28
session: "4ad6225b-2821-4a72-b049-196ee2efbd74"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I moved R-6.3, R-6.4 and R-6.5 from Slice 11 to Slice 14. One gap: I could not run `plan/check-coverage.mjs` itself, so the coverage condition is met only by a by-hand check.

**What changed.** The ruling returned the plan because R-6.3 to R-6.5 sat in Slice 11, which depends only on Slice 3. That meant Slice 11 could be built and verified before Slices 7 and 8 existed, even though the mail tests for these three criteria may go through those slices' screens. Slice 14 already depends on Slice 8 (which rests on 7, which rests on 3) and directly on Slice 11. So everything its tests can reach — profile editing, Code With Us creation, organization editing and the dashboard — exists before it is verified. I did not change any depends-on line.

The ruling offered two fixes; I took the move. The other, adding Slice 8 to Slice 11's dependencies, would have held back the whole organization branch (Slices 11, 12 and 13) behind opportunities just for three mail rules. The cost is an uneasy fit: service-wide mail rules are now answered for by the Code With Us proposal slice. The only reason they are there is that it is the first slice whose dependencies cover every screen those tests might send from.

**Edits in detail:**
- **`plan/tasks.md`:**
  - Removed the three criteria from Slice 11's criteria line.
  - Added them to Slice 14's criteria line, with a clause in its "delivers" line saying they are verified there.
  - Changed the "answered for in slices 3, 7, 8 and 11" wording in Slice 2's "delivers" line to "3, 7, 8 and 14".
- **`plan/plan.md`, note on awkward placements:**
  - Replaced the argument that the build order is linear with the dependency chain that actually guarantees those four screens exist.
  - Said why the earlier placement was returned and why the move was chosen over adding a dependency.
  - Kept the rest of the note.
  - Changed the R-6.3 reference in the environment-configuration bullet from Slice 11 to Slice 14.

Nothing else was touched. There are still 21 slices, and every other slice is as the ruling left it.

**Coverage check.** Running `plan/check-coverage.mjs` (and the same check in Python) needed an approval that nobody was present to give, and `jq` is not installed. Instead I used the tools I could run: the criteria lines in `plan/tasks.md` hold 248 placements of 248 distinct IDs, so nothing is duplicated. The IDs placed are the same set as in the version the ruling accepted as complete, because the edit only moved three of them.

I could not mechanically compare that set against the accepted, non-superseded entries in `spec/criteria-index.json`, so that comparison has not been redone in this run. The condition asked that the script be run before the revision is proposed. Whoever runs the pipeline should run it once (`node plan/check-coverage.mjs`) to confirm it prints PASS.

**Left for others.**
- I wrote no new decision record, because the move settles no new technical choice. Existing record 0006 mentions R-6.3 only as a behaviour of the sandbox environment, not its slice, so it still stands.
- Build conditions build-slice-2-5#1 and build-slice-2-8#2 are build work, not planning work. They stay open for the build stage.
- No spec, design, constitution or skill file was changed.