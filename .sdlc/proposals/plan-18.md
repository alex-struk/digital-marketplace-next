---
gate: G2
question: "Is this the right cut of the work, and does each slice stand on its own?"
recommendation: "I took up the one condition sent to this stage (build-slice-10-2) and moved R-1.19 out of Slice 10 into Slice 16, the slice that delivers the deadline hook."
opened: 2026-10-02T22:40:52.926Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the right cut of the work, and does each slice stand on its own?

**Recommendation.** I took up the one condition sent to this stage (build-slice-10-2) and moved R-1.19 out of Slice 10 into Slice 16, the slice that delivers the deadline hook.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

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

## Ruling

**Verdict:** approve
**By:** agent:architect
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether moving R-1.19 (state values of every program) from Slice 10 to Slice 16 is the right cut, with each slice standing on its own. Approved: R-1.19 now sits on exactly one slice's criteria line (plan/tasks.md:86, Slice 16). Slice 16's closure (Slices 15 back through 7) holds everything its test goes through: the Sprint With Us and Team With Us screens (Slice 10), the cancel action (Slice 9) and the deadline hook that moves a lapsed opportunity out of Published, which the G3 ruling on build-slice-10-2 found Slice 10 could not reach. Rejecting the alternative of pulling the hook into Slice 10 is sound, since the hook's other duties need proposals that only exist from Slices 14 and 15. The plan states the known gap (state values enforced from Slice 7 but answered for by no slice until 16). Slice 10's remaining dependency on Slice 9 is justified by R-1.39's need for the opportunity list. Tier is STANDARD, with no schema change, no new dependency and no stack departure, so nothing escalates. One cosmetic staleness: Slice 7's delivers line (plan/tasks.md:42) still lists the answering slices as '9, 10, 14, 15 and 18' without 16; it is a narrative pointer, not a criterion assignment, so it does not change the ruling. The proposal did not run the coverage script, and this ruling could not run it either because it needed approval. A run showing R-1.19 placed other than once, or the 248-placement total changed, would turn this into a return.

**Conditions:**
none
