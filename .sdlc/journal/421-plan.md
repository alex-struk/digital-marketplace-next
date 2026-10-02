---
stage: "plan"
title: "plan"
at: "2026-10-02T22:40:52.866Z"
cost: 0.40443300000000004
turns: 14
session: "9247f8c6-99a3-463e-bbb5-28a8ce6987f9"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I took up the one condition sent to this stage (build-slice-10-2) and moved R-1.19 out of Slice 10 into Slice 16, the slice that delivers the deadline hook.

**The finding.** The ruling on the Slice 10 build found that R-1.19 can't be shown working in Slice 10. One of its cases has a lapsed Sprint With Us opportunity move on to its evaluation stage. That only happens when the hook in front of `/api` and `/status` closes it, and the plan builds that hook in Slice 16. So once scheduled transitions had run, the seeded closed opportunity still read Published.

**Why I moved the criterion and not the hook.** The ruling offered both options. Bringing the hook forward into Slice 10 would have delivered it half-built. Its other jobs are listing proposals to review, giving proponents anonymous names and notifying the author or the evaluation panel. All three need proposals, which don't exist until Slices 14 and 15. Slice 16 depends on Slice 15, so everything R-1.19's test goes through is built by then:
- the Sprint With Us and Team With Us screens (Slice 10);
- the cancel action its "finally reaches cancelled" example uses (Slice 9);
- the hook itself.

**What changed in the files.**
- **`plan/tasks.md`:** R-1.19 is gone from Slice 10's criteria and its delivers line. It now appears in Slice 16's criteria, and Slice 16's delivers line explains why it is answered for there.
- **`plan/plan.md`:** I rewrote the R-1.19 passage in "Criteria that sit awkwardly where they are". It records the ruling, the move and why bringing the hook forward was rejected. It also states a known gap: the store has enforced the state values since Slice 7, so for nine slices that rule is in force with no slice answering for it.
- **Slice 10's dependency on Slice 9 stays.** It was first added for the cancel action, which Slice 10 no longer needs. But Slice 9 is also how Slice 10 reaches the opportunity list (Slice 8), which R-1.39 needs. Nothing changes in build order.

Nothing else was touched: the other slices, the Constitution check and every decision record are as they were. I wrote no new decision record, because this is a placement change and the plan text already explains it.

**Checking.** I couldn't run the coverage script (`plan/check-coverage.mjs`) because running commands needed approval this session didn't have. I searched the criteria lines by hand instead, and R-1.19 now appears in exactly one slice, Slice 16. The move adds no criterion and drops none, so the 248 placements should be unchanged, but the script hasn't confirmed it.

**Assumption.** I took the ruling's phrase "when scheduled transitions run" to mean the existing on-request deadline hook (decision record 0005), not a separate scheduler. No new platform choice is implied.

No conditions were addressed to a person, and I'm deferring no requests.