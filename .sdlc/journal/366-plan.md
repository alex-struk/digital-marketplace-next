---
stage: "plan"
title: "plan"
at: "2026-10-01T11:50:27.408Z"
cost: 0.6327362000000001
turns: 22
session: "d753e606-8406-41c9-aaad-e8ae510f074c"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I took up the one condition addressed to this stage. R-8.19 and R-8.25 now sit in Slice 15 instead of Slice 7. The plan still has 21 slices, and all 248 accepted criteria are still placed exactly once. I couldn't run `plan/check-coverage.mjs` because running a script here needs an approval this session can't get. Instead I searched the file and confirmed that the only `criteria:` line naming either ID is Slice 15's. Whoever next has a shell should run `node plan/check-coverage.mjs .` to confirm it mechanically.

**The ruling.** It found that both tests passed every Code With Us case against Slice 7's build. The rest was unbound because the tests also need other screens:
- R-8.19 says "for all three programs alike", so its test attaches files on the Sprint With Us and Team With Us create screens, which Slice 10 builds.
- R-8.25's test attaches a file to a Code With Us proposal, a screen Slice 14 builds.

**Why Slice 15 and not Slice 14.** Slice 14 builds the last of those screens in build order, but it does not depend on Slice 10. Putting the two criteria there would have meant adding that dependency, so the Code With Us proposal slice could not be built or shown until Sprint With Us creation existed. Slice 15 (Sprint With Us and Team With Us proposals) already depends on Slices 14, 13 and 10, so it covers all three screens with no dependency change. The ruling allowed "or a later slice", and I chose that because it leaves the dependency graph as it was.

**What changed:**
- **Slice 7** no longer claims the two criteria. Its "delivers" text now says both rules are still built there with the attachment control, but are answered for in Slice 15.
- **Slice 15** claims both, and its "delivers" text explains why they sit there. It also notes that the proposal half of R-8.25 is built in Slice 14 alongside R-8.20.
- **`plan/plan.md`:**
  - A new item under "Criteria that sit awkwardly where they are" gives the reasoning above and why the fit is uneasy: two file rules are answered for by a proposal slice only because that is where their tests can first run.
  - The R-8.25 vs R-8.20 tension now names "slices 15 and 14".
  - The files row of the coverage table now includes Slice 15, and its note records the move. No counts changed.

No other slice, criterion, constitution-check text or decision record was changed, and I wrote no new decision record. Nothing about the stack or platform had to be newly assumed.

Two things I noticed but left alone, because the condition didn't name them:
- **Stale coverage table.** Its files row still omits Slice 11, which holds R-8.13, R-8.21, R-8.28 and R-8.30. Its notifications row also omits slices that now hold notification criteria (12, 14 and 18). The table is stale beyond this change, and someone should fix it in a revision that asks for it.
- **Missing decision record.** The ruling cites decision record 0030 for Sprint With Us and Team With Us creation being in Slice 10. This workspace's records stop at 0028, so 0030 must exist downstream or be misnumbered. The placement it cites matches this plan either way.

There were no conditions addressed to a person, and nothing asked for changes to spec, design, the constitution or skills.