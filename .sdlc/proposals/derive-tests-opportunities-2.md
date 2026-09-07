---
gate: G3
question: "Do the revised opportunities tests now follow from their criteria and from nothing else?"
recommendation: "No dependencies are installed in this workspace (`tests/node_modules` is absent), so I could not run the typecheck or the separation check; both files use only the same imports and call shapes as the …"
opened: 2026-09-07T15:58:52.887Z
---

# Do the revised opportunities tests now follow from their criteria and from nothing else?

**Recommendation.** No dependencies are installed in this workspace (`tests/node_modules` is absent), so I could not run the typecheck or the separation check; both files use only the same imports and call shapes as the …

No dependencies are installed in this workspace (`tests/node_modules` is absent), so I could not run the typecheck or the separation check; both files use only the same imports and call shapes as the neighbouring specs that already pass.

**Journal**

I acted on two of the three conditions and left the third alone by doing nothing, which is what it asked for.

For the first condition, I rewrote `tests/acceptance/opportunities/R-1.7.spec.ts` so that each of its two tests actually attempts the creation the criterion is about, instead of inspecting what the requester was offered. Both tests now open the Code With Us create page and call `saveDraft` with a title of their own — as a vendor in the first test, signed out entirely in the second — and then sign in as an administrator and assert that the title does not appear in `opportunityList.unpublishedGroup()`. That is the route the review named, and the same shape R-1.48's first test uses: an administrator is the one requester certain to see an opportunity whatever state it reached, and a draft that had been created would stand in the unpublished group. The `programCard()` and `myOpportunitiesTable()` assertions are gone, along with the reasoning comment that justified them; the replacement comment says why the reading is done by an administrator and notes that R-1.48 already establishes that a title-alone draft is accepted from a permitted requester, so nothing but the requester's standing is left to refuse it here. The vendor test signs out before the administrator reads back; the anonymous test has no session to drop. The header lines are untouched apart from being the same two lines they were.

For the second condition, I corrected only the comment block at the top of `R-1.55.spec.ts`. It had claimed that marking a member as chair is the only chair action there is, which is not true — the panel surface also carries `choosePanelChair` and a `chairField()` observation. The reason it now gives is the real one: the surface names errors for too few members, a duplicate member, a missing chair and a non-public-sector member, but none that names a second chair, and since the criterion requires the reason for the refusal to be named, a refusal for a second chair could not be told apart from a refusal for anything else. The four test bodies in that file are byte-for-byte as I found them.

For the third condition I changed nothing: the other 35 spec files in the domain and all 14 not-testable entries are exactly as they were. I re-derived nothing and rewrote no "derived" date — as it happens both files I did change carry today's date already, so nothing moved there either. I confirmed R-1.7 and R-1.55 are not listed in `not-testable.yaml`, and no criterion in this run turned out to be unreachable through the surface, so no entry needed adding.

Nothing was missing from the contract for this work. The one gap worth carrying forward to whoever writes the contract next is the one R-1.55's comment now records: an evaluation panel error observation that names a second chair — something alongside `minimumMembersError`, `duplicateMemberError`, `missingChairError` and `nonPublicSectorMemberError` on both `EvaluationPanelSwuPage` and `EvaluationPanelTwuPage`. Without it, the fifth fault R-1.55 lists stays unassertable, since the criterion demands the reason be named and no observation can read that particular reason.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Both conditions are met and nothing else moved: the diff against the returned proposal touches only R-1.7.spec.ts and R-1.55.spec.ts, 26 lines. R-1.7 now attempts the creation the criterion names and reads the refusal from whether an opportunity was created, checked as an administrator against opportunityList.unpublishedGroup(); the programCard() and myOpportunitiesTable() shape assertions are gone, so nothing is asserted beyond 'the request is refused and no opportunity is created'. R-1.55's header now gives the real reason, verified against spec/contract/surface.yaml:781-798, which carries minimum_members_error, duplicate_member_error, missing_chair_error and non_public_sector_member_error but no second-chair error, while also carrying choose_panel_chair and chair_field: the fifth fault is unassertable because the criterion requires the reason to be named and no observation reads it. The four R-1.55 test bodies and the other 34 specs and 14 not-testable entries are unchanged from the set the previous ruling verified. No implementation detail leaks into any assertion. The receipt names what it could not check (tests/node_modules absent, so no local typecheck or separation run) and the harness ran separation and tests green; the five tests warnings are pre-existing and belong to the files and notifications domains. STANDARD tier, no unaccepted residual risk, so no escalation.

**Conditions:**
none
