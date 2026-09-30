---
gate: G2
question: "Is this the right cut of the work, and does each slice stand on its own?"
recommendation: "I took up the one condition I was given."
opened: 2026-09-30T23:45:59.501Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the right cut of the work, and does each slice stand on its own?

**Recommendation.** I took up the one condition I was given.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I took up the one condition I was given. R-4.23 has moved out of Slice 2 and into Slice 14. The plan is otherwise unchanged: still twenty-one slices in the same order, with the same dependencies and constitution check, and no new or changed decision records.

The ruling offered two remedies: move the criterion to the slice that builds the dashboards, or pull the dashboards' empty states and listings into Slice 2. I moved it. R-4.23's test reads two different dashboards, and they arrive in different slices. The staff and administrator dashboard, with its opportunities table and empty message, comes in Slice 8. The vendor dashboard, with its own and organization proposals and empty message, comes in Slice 14.

The ruling named Slice 6 for the vendor dashboard, but in this plan Slice 6 is the changed-terms slice; the vendor dashboard is in Slice 14. Slice 14 depends on Slice 8, so it is the first slice where both dashboards exist, and that is where the criterion now sits.

I turned down the other remedy. Building empty dashboards into Slice 2 would bring the opportunity and proposal listings in before the data they list, which is the same reason R-4.22 had already been moved to Slice 8.

The redirect itself is still built in Slice 2, where the build already showed it working. Slice 2's text now lists R-4.23 among the criteria it builds for but that a later slice answers for. Slice 14's delivers line now names the vendor dashboard's empty message and says the redirect is shown landing on both dashboards.

In `plan/plan.md`, the section on criteria that sit awkwardly has a new entry for R-4.23. It says why it moved, why the other remedy was turned down, and that the fit is uneasy. Like R-6.3 to R-6.5, a sign-up rule is now answered for by the Code With Us proposal slice only because that is where the vendor's dashboard first exists.

Placement: R-4.23 now appears on one criteria line, Slice 14's, and I took nothing else out, so all 248 criteria should each still be in exactly one slice. I could not run `plan/check-coverage.mjs` to confirm this, because running it needed an approval that nobody was here to give. I checked R-4.23 by searching the criteria lines instead, and the checker should be run when this is ruled on.

The Slice 2 build (build-slice-2-15) showed the vendor dashboard read coming back empty. That is a build-verification matter for the tech lead, and I left it alone. Nothing asked me to change spec, design, the constitution or skills, and I did not touch them.

## Ruling

**Verdict:** approve
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether moving R-4.23 out of Slice 2 gives a cut where the slice claiming it can produce what its test observes. Ruling: approve. What decided it is the third item of the escalation account. Build-slice-2-15 showed the profile-completion redirect working (terms checkbox absent for both people) while the test failed only because its dashboard reads came back empty, and those dashboards are not Slice 2's. In plan/tasks.md the staff and administrator dashboard is delivered by Slice 8 (line 47) and the vendor dashboard by Slice 14. Slice 14 depends on Slice 8 and Slice 11, so its dependency closure holds both screens, and it is the earliest slice where R-4.23's test can bind. The proposal correctly points out that the account's 'slices 6 and 8' named the wrong slice for the vendor dashboard. It correctly turns down the alternative remedy (empty dashboards in Slice 2) for the same reason R-4.22 was already moved to Slice 8: listings should not arrive ahead of the data they list. The diff matches the evidence and nothing else moves. Slice 2's criteria line loses only R-4.23, its delivers line records that the redirect is still built there, Slice 14 gains only R-4.23 plus a delivers clause naming the vendor dashboard's empty message, and plan.md's awkward-fit section records the move and its uneasiness. A search of plan/tasks.md shows R-4.23 on exactly one criteria line, Slice 14's. This meets the revision request build-slice-2-15 sent to plan. plan/check-coverage.mjs was not run, here or by plan, because it needs an approval nobody was present to give. It should be run before Slice 14 is built. What would change this ruling: that checker reporting any criterion unplaced or placed twice, or Slice 8 turning out not to deliver the public sector employee's opportunities table and empty message that R-4.23's test reads.

**Conditions:**
none
