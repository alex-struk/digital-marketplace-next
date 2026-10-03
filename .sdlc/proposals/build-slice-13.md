---
gate: G3
question: "Does slice 13 (An organization can qualify for Sprint With Us and Team With Us) do what its criteria say?"
recommendation: "I built all four of slice 13's criteria: R-3.25, R-3.26, R-3.27 and R-3.28."
opened: 2026-10-03T18:53:16.511Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does slice 13 (An organization can qualify for Sprint With Us and Team With Us) do what its criteria say?

**Recommendation.** I built all four of slice 13's criteria: R-3.25, R-3.26, R-3.27 and R-3.28.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I built all four of slice 13's criteria: R-3.25, R-3.26, R-3.27 and R-3.28. `npm --prefix app run check` passes. Both typechecks are clean, and the unit tests pass: 570 in the backend and 384 in the frontend.

**Starting point.** Slice 11 had already worked out both "qualified" flags and shows the marks on the organization list (`organization-swu-qualified-mark`, `organization-twu-qualified-mark`), in the person's organizations section, and as badges on the management page. What was missing:
- the service refused the three update tags other than `updateProfile`;
- the two qualification tabs only said "not available yet";
- the terms pages had no route.

**Service.** `PUT /api/organizations/{id}` now accepts the contract's three other tags:
- **`acceptSWUTerms` / `acceptTWUTerms`** (R-3.27): the owner or a service administrator may accept; anyone else gets 401 under `permissions`. The date is recorded once. A second attempt gets 400 with "The … terms and conditions have already been accepted for this organization.", and the first date stands.
- **`qualifyServiceAreas`** (R-3.28): only a service administrator may use it, so the owner also gets 401. The value is a list of the five service-area keys. Within one transaction it deletes the organization's existing approvals and writes the new selection, so a save replaces earlier approvals entirely. Unknown keys get 400 and nothing changes.
- **The organization's record** now includes `swuRequirements`, which says whether each of the three Sprint With Us conditions is met (counting active members only). It comes from a new rule, `sprintWithUsRequirements`. The existing `qualifiesForSprintWithUs` is now that rule with all three met, so the tab, the badges and the list marks can't disagree.

The new rules (`mayAcceptProgramTerms`, `offersProgramTermsAcceptance`, `mayQualifyServiceAreas`, `serviceAreaSelection`) live in `backend/src/rules/organizations.ts`, which the screens share.

**Screens.**
- **Qualification tabs** (`organization-qualification.tsx`, reached at `/organizations/:orgId/edit?tab=swu-qualification` and `?tab=twu-qualification`): they follow the swu-qualification, swu-qualified, twu-qualification, twu-administrator and service-areas-editing stories. Each requirement shows "Met" or "Not met", with the not-qualified notice when it applies. The terms section shows the acceptance date, with a link that says "Read and accept" only where the terms page will offer Accept. The Team With Us tab lists the approved areas. Only a service administrator gets "Edit service areas", which opens the five checkboxes with Save and Cancel; the owner is told only an administrator can change them.
- **Terms pages** (`organization-terms.tsx`): at `/organizations/:orgId/sprint-with-us-terms-and-conditions` and `/organizations/:orgId/team-with-us-terms-and-conditions`. They show the body of the fixed page at the same slug under `/content`. Accept is offered to the owner only, and only until the terms are accepted. After accepting, the page goes back to the matching qualification tab, where the date is shown. Once accepted, the page shows the date and only "Back to the organization". An administrator is not offered Accept. Anyone who can't read the organization gets the missing page.

**Tests.**
- Rule tests: the requirement breakdown, who may accept, when Accept is offered, administrator-only service areas, and how a selection is normalised.
- End-to-end tests over the real schema and acceptance seed:
  - the seeded qualified organization meets every requirement of both programs;
  - non-administrators are refused service areas;
  - two saves in a row replace rather than add to each other;
  - an invalid key leaves the approvals unchanged;
  - acceptance is recorded once and the second attempt is refused with the date unchanged.
- A new frontend file, `frontend/tests/qualification.test.tsx`, with nine screen tests covering both tabs, the administrator's edit-and-save (including the exact request sent), and the terms pages: owner accepting, already accepted, administrator, a refused second acceptance, and someone refused the organization.

**Choices the spec left open.** These are recorded in `docs/decisions/0053-qualifying-for-sprint-with-us-and-team-with-us.md`:
- The service lets a service administrator accept terms because the contract's 401 rule for the route says so, but no screen offers it. That matches R-3.27's note that acceptance is the organization's own act.
- An organization administrator who isn't the owner can read the terms but can't accept them.
- Service areas are shown by the service's own names ("Full Stack Developer"), since the stories mark their sentence-case names as illustrative.

**Not built here.** I changed nothing outside `app/` and `docs/decisions/`, and nothing in the compose file: no new services or ports were needed. Slice 15 will need to use these qualified flags to refuse Sprint With Us and Team With Us proposals from unqualified organizations. The record already provides what it needs (`swuQualified`, `twuQualified`, `serviceAreas`).

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Does slice 13 do what R-3.25–R-3.28 say? The verify result is fail on all four, so this cannot be approved. Every failure traces to the adapter, not the application. R-3.25: the page outline shows each Sprint With Us requirement as one list item, 'Met At least two active team members', 'Met Active team members between them hold every capability', 'Not met Sprint With Us terms and conditions accepted', but the adapter's line-matching read returns only the label line, because the Met/Not met badge renders on a line of its own, so before and after read identically. R-3.28: the adapter reads approvals only from checkboxes, which the Team With Us tab draws only after 'Edit service areas' is pressed; the tab lists approvals as list items, so the read was empty. Its save step also only ticks boxes and never clears unnamed ones, so the criterion's replacement could not be driven. R-3.26 was skipped as blocked on that same empty read. R-3.27's unbound reason describes an earlier build in which the terms page was 'Page not found'; the evidence shows it now renders the terms body with 'Accept terms and conditions', so it needs re-binding. The backend and screen code match the criteria, with service-side 401/400 refusals and unit and end-to-end coverage of the new seams. This ruling would become an approval once a re-bound adapter produces a current verify result with nothing failing.

**Conditions:**
- addressed-to bind-adapter: R-3.25: organizationEdit.swuRequirementTwoMembers / swuRequirementAllCapabilities / swuRequirementTermsAccepted read only the text line matching the requirement's wording ('At least two active team members'), so the status beside it is lost and the met and unmet readings are identical. On /organizations/:orgId/edit?tab=swu-qualification each requirement is one list item in the list named 'Sprint With Us requirements', whose full text is 'Met <requirement>' or 'Not met <requirement>' (evidence .sdlc/evidence/slice-13/R-3.25.txt lines 44-47). Read the whole list item, status included.
- addressed-to bind-adapter: R-3.28: organizationEdit.serviceAreaCheckbox read "" on /organizations/00000000-0000-4000-8000-000000000301/edit?tab=twu-qualification because it reads only checkboxes, which the Team With Us tab draws only after 'Edit service areas' is pressed. Until then the tab lists the approved areas under the heading 'Approved service areas' as list items named by label ('Full Stack Developer', 'Agile Coach'). Read the approvals from that list, or open the editor before reading the boxes. Also, organizationEdit.saveServiceAreas only ever ticks the named boxes and never unticks the others, so a save of [kept, third] leaves the cleared area ticked. It must leave exactly the named areas ticked before pressing 'Save service areas'.
- addressed-to bind-adapter: R-3.26: both tests were left with no result. The first was skipped as 'blocked' because its establishApproval reads approvals through organizationEdit.serviceAreaCheckbox, which returns empty on the Team With Us tab for the reason given for R-3.28, so the given could never be built. Re-binding serviceAreaCheckbox and saveServiceAreas as described for R-3.28 unblocks it. organizationEdit.twuRequirementServiceArea / twuRequirementTermsAccepted read with the same line-matching as the Sprint With Us requirements and need the same fix: read the whole list item in the list named 'Team With Us requirements', 'Met …' or 'Not met …'. organizationTwuTerms.acceptedOnNotice needs binding as described for R-3.27.
- addressed-to bind-adapter: R-3.27: organizationSwuTerms.acceptedOnNotice was reported unbound with a reason describing an earlier build where /organizations/:orgId/sprint-with-us-terms-and-conditions answered 'Page not found'. On the current build the page renders for the owner (evidence .sdlc/evidence/slice-13/R-3.27.txt): heading 'Sprint With Us Terms & Conditions', the 'Terms and conditions' region holding the terms body, and 'Accept terms and conditions' and 'Cancel'. Once accepted, it shows a paragraph '<legal name> accepted these terms on <date>' and only 'Back to the organization'. Bind acceptedOnNotice to that paragraph (empty while unaccepted), termsBody to the 'Terms and conditions' region and acceptTerms to 'Accept terms and conditions', and the same for organizationTwuTerms at /organizations/:orgId/team-with-us-terms-and-conditions. Accepting returns to the matching qualification tab.
