---
gate: G2
question: "Is this the right cut of the work, and does each slice stand on its own?"
recommendation: "I took up the one request this revision carries, from the G3 ruling on build slices 3–4, and changed nothing else in the plan."
opened: 2026-10-01T02:19:02.484Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the right cut of the work, and does each slice stand on its own?

**Recommendation.** I took up the one request this revision carries, from the G3 ruling on build slices 3–4, and changed nothing else in the plan.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I took up the one request this revision carries, from the G3 ruling on build slices 3–4, and changed nothing else in the plan. There are still twenty-one slices in the same order, and none of the existing decision records changed.

**What I changed.** Slice 3 had claimed R-8.13, R-8.21, R-8.28 and R-8.30 in full. Each of these covers both a profile picture and an organization logo. The acceptance suite tests the logo half on `/organizations/:orgId/edit`, and for R-8.28 on the public organization list as well. Slice 3 builds neither screen, so the verify run found those halves unbound or failing while the picture halves passed.

- **Where they went:** all four criteria now sit whole in Slice 11. That slice builds the organization list and the management page's profile tab with its logo, and its stated deliverable now names `/organizations/:orgId/edit` and the four image rules.
- **Why the picture halves still work there:** Slice 11 already depends on Slice 3, so it can show both halves of each criterion.
- **What stays in Slice 3:** the image route, type checks and resizing are still built in Slice 3. Its deliverable text now says these four criteria are answered for in Slice 11. The logo is just a second caller of the same route.
- **Count:** Slice 3 drops from 28 criteria to 24 and Slice 11 grows from 12 to 16. Each of the four appears in exactly one slice's criteria list.

**Options I turned down.**
- **Making Slice 11 a prerequisite of Slice 3:** this would hold profile editing back behind organizations, and everything that depends on Slice 3 (Slices 4, 5, 7 and 11 itself) would wait with it.
- **Moving only the logo halves:** this would need new criterion IDs, and authoring those belongs to the spec stage, not this one.

`plan/plan.md` now has a paragraph on these four criteria under "Criteria that sit awkwardly where they are". It gives the reason for the move and the alternatives turned down. It also notes the same unease as with R-8.17: the behaviour is built in one slice and answered for in a later one, where every half of its test can run.

**What I could not do.** I couldn't run the coverage checker, `plan/check-coverage.mjs`, because running it needed approval and nobody was there to give it. I checked by search instead that each of the four moved criteria appears in exactly one criteria line. I didn't re-check the full set of 248 mechanically, but no other placement changed.

I assumed nothing new about the stack or the platform, wrote no new decision record, and found no condition addressed to a person.

## Ruling

**Verdict:** approve
**By:** agent:architect
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: is this the right cut of the work, and does each slice stand on its own, now that the plan has taken up the G3 request from build-slice-3-4? Ruling: approve. R-8.13, R-8.21, R-8.28 and R-8.30 each cover a profile picture and an organization logo. The acceptance suite tests the logo half on /organizations/:orgId/edit, and for R-8.28 on the public organization list too. Slice 3 builds neither screen. Slice 11 builds both and already depends on Slice 3, so it can show both halves of each criterion. Moving all four whole to Slice 11 is the right cut. Splitting each criterion into a picture half and a logo half would need new criterion IDs, which only the spec stage can author. Making Slice 11 a prerequisite of Slice 3 would hold Slices 4, 5, 7 and 11 behind organizations. The proposal rejects both alternatives for these reasons. Slice 3's deliverable still builds the image route, type checks and resizing, and says those rules are answered for in Slice 11. Slice 3 still stands on its own with its remaining 24 criteria. A search of plan/tasks.md shows each of the four criteria in exactly one criteria line, Slice 11's. The full coverage checker was not run, but the diff only moves those four IDs between two slices, so no criterion lost its slice. As architect: no schema change, no new dependency, no change to the stack or to any decision record, and the tier is STANDARD, so nothing has to be escalated. No J3 forbidden pattern appears. The plan.md note says the move is uneasy in the same way as R-8.17: the behaviour is built in one slice and answered for in a later one. That is a fair statement of the cost. The owed conditions build-slice-3-4#3, #4 and #5 belong to build and are not settled by this plan change. #3 and #4 describe picture-picker behaviour that Slice 3 still builds, so they remain owed by build. I leave all three open on purpose. This ruling would change if a criterion were found in no slice or in two, or if Slice 11 turned out not to build the /organizations/:orgId/edit screen its deliverable now names.

**Conditions:**
none
