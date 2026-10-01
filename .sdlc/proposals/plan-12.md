---
gate: G2
question: "Is this the right cut of the work, and does each slice stand on its own?"
recommendation: "Slice 7 now claims only what its own screens make walkable."
opened: 2026-10-01T08:17:35.217Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the right cut of the work, and does each slice stand on its own?

**Recommendation.** Slice 7 now claims only what its own screens make walkable.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've moved all six criteria the slice 7 ruling named into slices whose build serves the screens their tests walk. Slice 7 now claims only what its own screens make walkable.

There are still 21 slices in the same order with the same dependencies. No criterion was added or dropped: the six were moved, not re-scoped, so the total stays at 248. I couldn't run `plan/check-coverage.mjs` because the session didn't grant permission to run it. Instead I searched the criteria lines by hand: each of the six now appears in exactly one slice, and none of them is left in slice 7.

**Where each one went and why.** Everything these criteria describe is still built in slice 7: the program chooser, the state model and transition table for all three programs, the check on creating as published, the blind-copy batching, and the publish action. Only the slice that answers for each one moves.

- **R-1.8, R-1.19, R-1.48 and R-6.15 go to slice 10.** That slice builds `/opportunities/sprint-with-us/create` and the Sprint With Us view, and it depends on slice 7.
- **R-1.20 goes to slice 9,** which builds cancellation. Its dependencies include slices 8 and 7, so the screens it needs are there.
- **R-6.2 goes to slice 14,** not slice 11, even though the ruling named the organization edit page. Its test also publishes an opportunity, which only slice 7 builds, and slice 11 depends only on slice 3. An earlier revision was sent back for putting service-wide mail rules in slice 11 on exactly that ground. Slice 14 is the first slice that depends on both slices 7 and 11, and R-6.3 to R-6.5 already sit there for the same reason.

**Criteria that still fit awkwardly:**
- **R-1.20:** its example of refusing a change out of an awarded opportunity can't be reached until slice 16 awards anything. In slice 9, the cancelled-is-final and skip-a-stage refusals can be walked; the awarded half is only exercised once slice 16 lands.
- **R-1.8, R-1.19 and R-1.48:** these are rules about all three programs, answered for in the Sprint With Us slice.
- **R-6.2:** a service-wide mail rule answered for in the Code With Us proposal slice.

`plan/plan.md` records all three under "Criteria that sit awkwardly where they are". The slice 7 entry that defended keeping R-1.19 and R-1.20 there is replaced with this placement, and the older R-6.2 history now points to it.

**Other edits:** in `plan/tasks.md`, slice 7's description now lists what it builds but leaves for slices 9, 10 and 14 to answer for. Slices 9, 10 and 14 say what they take on. Slice 2's cross-reference no longer names slice 7 among the slices that answer for its mail and sign-up criteria.

**Constitution and decision records:** nothing in the constitution check needed to change. No slice's scope, stack or data handling changed, so I wrote no new decision record. Decision record 0013 still says the blind-copy shape is "used from slice 7". That remains true of the build, so I left it alone.

**Assumptions:** I assumed from the ruling's wording that R-6.2's test also publishes an opportunity, which is that criterion's given. If its test goes only through `/organizations/:orgId/edit`, it can move to slice 11 without changing anything else.

No conditions were addressed to a person, and none asked me to change paths outside `plan` and `docs/decisions`. Nothing is deferred.

## Ruling

**Verdict:** return
**By:** agent:architect
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: is this the right cut of the work, and does each slice stand on its own? Ruling: return. The revision takes up the G3 ruling on build-slice-7-3 and four of its six moves hold against the tests: R-1.20 in Slice 9 (its test cancels a Code With Us opportunity, and Slice 9 builds cancellation), R-1.8 and R-1.48 in Slice 10 (Sprint With Us and Team With Us create screens), and R-6.2 in Slice 14 (its test goes through surface.organizationEdit as well as Code With Us publish, and Slice 14's dependencies include both Slice 7 and Slice 11). Two moves repeat the defect the revision exists to fix. R-6.15's test checks two notices. The second walks Team With Us individual evaluation and consensus submission (evaluationIndividualCreateTwu, evaluationConsensusCreateTwu) to reach the owner's notice, and those screens are built in Slices 17 and 18. Slice 10's dependency chain is Slice 7 and Slice 3 only. R-1.19's third test ('an opportunity finally reaches cancelled') calls cancelOpportunity. Only Slice 9 builds that, and Slice 10's chain does not include Slice 9. Both would be unbound at Slice 10's build for the same reason they were at Slice 7's. Tier is STANDARD, the plan makes no schema change and adds no dependency, so nothing needed escalating. The owed build conditions build-slice-7-3#1 and #2 are not settled by a plan change and stay open. What would change the ruling: R-6.15 placed in a slice whose dependencies include Slice 18, and R-1.19 placed where both cancellation (Slice 9) and the Sprint With Us view (Slice 10) exist. That means either giving Slice 10 a dependency on Slice 9, or moving R-1.19 to the first slice that depends on both. Record both under 'Criteria that sit awkwardly where they are'.

**Conditions:**
- Move R-6.15 out of Slice 10. Its test also checks the owner's notice, which it reaches by walking Team With Us individual evaluation and the chair's consensus submission (screens built in Slices 17 and 18). Slice 10 depends only on Slice 7. Place R-6.15 in Slice 18 or a later slice whose dependencies include it, and update the Slice 7 and Slice 10 entries and the plan.md reservation to match.
- Fix R-1.19's placement. Its test cancels an opportunity with the cancel action, which only Slice 9 builds, and Slice 10 does not depend on Slice 9. Either add Slice 9 to Slice 10's dependencies (and say why in plan.md), or move R-1.19 to the first slice that depends on both Slice 9 and Slice 10. In both cases, record the reservation in plan.md.
