---
gate: G2
question: "Is this the right cut of the work, and does each slice stand on its own?"
recommendation: "I moved R-6.3, R-6.4 and R-6.5 from Slice 11 to Slice 14."
opened: 2026-09-30T18:36:07.774Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the right cut of the work, and does each slice stand on its own?

**Recommendation.** I moved R-6.3, R-6.4 and R-6.5 from Slice 11 to Slice 14.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

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

## Ruling

**Verdict:** approve
**By:** agent:architect
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: is this the right cut of the work, and does each slice stand on its own, now that R-6.3, R-6.4 and R-6.5 have moved from Slice 11 to Slice 14? Ruling: approve. Reason: plan-4 was returned because Slice 11 depends only on Slice 3, so these three service-wide mail criteria could be verified before the screens their tests may send from existed. The depends-on lines in plan/tasks.md now guarantee those screens: Slice 14 depends on Slice 8, which depends on 7, which depends on 3, and Slice 14 also depends directly on Slice 11. So profile editing, Code With Us creation, the dashboard and organization editing all exist before Slice 14 is verified. The plan.md note now argues from that dependency chain instead of from a linear build order, and it explains why the move was chosen over adding Slice 8 to Slice 11's dependencies: that would have held the organization branch behind opportunities. Coverage: plan/check-coverage.mjs could not be run in this session either, because it needs an approval nobody was present to give. I repeated its logic by hand against spec/criteria-index.json. The index holds 248 accepted, non-superseded criteria (content 26, evaluation 30, files 24, notifications 21, opportunities 50, organizations 31, proposals 36, users 30). The 21 criteria lines in plan/tasks.md hold 248 placements. No superseded or obsolete ID is placed, and the users and notifications domains, where every move happened, each come to their expected count. That is the script's PASS condition. The tier is STANDARD, there is no schema change and no new dependency, so nothing escalates. The build conditions build-slice-2-5#1 and build-slice-2-8#2 are not settled here and stay open. What would change the ruling: the script printing FAIL when it is actually run, or the builder finding that the R-6.3 to R-6.5 tests reach a screen outside Slice 14's dependencies.

**Conditions:**
- condition-met plan-4#1: R-6.3, R-6.4 and R-6.5 now sit on Slice 14's criteria line in plan/tasks.md. Slice 14 depends on Slices 8 and 11, and Slice 8 depends on 7, which depends on 3, so all four named screens are in its dependencies.
- condition-met plan-4#2: the awkward-placements note in plan/plan.md now names the chain from Slice 14 through 8 and 7 to 3, plus the direct dependency on 11, as what guarantees the four screens exist. The rest of the note is kept.
- condition-met plan-4#3: the script could not be run, so the architect repeated its check by hand against spec/criteria-index.json and plan/tasks.md: 248 accepted, non-superseded criteria and 248 placements across 21 slices, none duplicated and none superseded or obsolete. That is the script's PASS condition.
