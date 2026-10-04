---
gate: G3
question: "Does slice 14 (A vendor can propose on a Code With Us opportunity) do what its criteria say?"
recommendation: "The next acceptance run is what will show whether it worked."
opened: 2026-10-04T02:13:27.147Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does slice 14 (A vendor can propose on a Code With Us opportunity) do what its criteria say?

**Recommendation.** The next acceptance run is what will show whether it worked.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I've made a fix for R-2.13's "no complete proponent" case, but I couldn't reproduce the failure, so the fix rests on my best reading of the evidence. The next acceptance run is what will show whether it worked.

**What failed.** The test gave only proposal text on the create screen and submitted, then found the proposal listed as Submitted on the vendor dashboard. The dashboard shows it was an individual proposal, not one for the vendor's organization.

**What I ruled out.** The service already refuses a submission without a complete individual, both on create and when a draft is submitted. The create form also checks before it asks for the terms, and a unit test confirmed that a blank individual can't get past it. Clicking the element that carries `proposal-proponent-organization` does switch the form to an organization. So the only way the proposal could have gone through is that the individual's fields were filled in on the screen.

**Why I think that happened.** The form opened with "An individual" already selected, as the design catalogue's create stories draw it, so the individual's fields were showing from the start. The contract has a `choose_proponent_individual` action as well as the organization one. That only makes sense if the old screen chose nobody until the vendor did. My guess is that the test's driver filled whichever individual fields were on the page. On the old screen none were showing, so nothing was filled; on ours they were all filled. I can't see the test or its driver, so this is inference.

**The change.**
- **Create form:** it now opens with neither "An individual" nor "An organization" selected. Until the vendor picks one, it shows neither the individual's fields nor the organization choice, just a line saying what each choice asks for.
- **Submitting without a choice:** this is refused before the terms dialog opens. It produces one problem in the error summary, linked to the radio group: "Proponent: choose whether an individual or an organization is submitting this proposal", plus anything wrong with the proposal text or comments.
- **Drafts:** a draft can still be saved with no choice. It comes back unchosen when reopened, and its manage page refuses Submit in the same way.
- **The service:** unchanged.

To support this I added a "Proponent" field name to the shared proposal rules and moved the form's check and the manage page's Submit check into one function, `submissionProblems`, in `proposal-cwu-form.tsx`.

**Tests.** I added two frontend unit tests:
- On the create screen, neither radio starts selected and neither set of fields shows. Submitting with only proposal text gives exactly the proponent problem, opens no terms dialog and sends nothing.
- On the manage page, Submit on a draft kept with no proponent is refused the same way.

The existing create-screen tests now pick "An individual" before typing. `npm --prefix app run check` passes: typecheck plus 16 migrations tests, 654 backend tests and 409 frontend tests. I deleted the `node_modules` I installed so only source changes go back.

**Departure from the catalogue.** The create and edit forms no longer select "An individual" at the start, which the stories draw with `defaultValue="individual"`. Every element, label, test id and the layout are otherwise as drawn. Changing the stories belongs to the design stage, not here. Decision record `docs/decisions/0056-a-code-with-us-proposal-starts-with-no-proponent-chosen.md` sets out the reasoning so that stage can catch up.

**Risk.** If any acceptance test that submits as an individual relied on the pre-selected radio and never chose "An individual", it would now be refused. Tests written against the old screen should already make that choice, but I can't confirm it.

**Also found, not fixed.** Saving a draft with "An organization" chosen but no organization picked sends an empty organization id, and the store writes it straight into the organization column. That likely fails to save, which goes against R-2.12 (a draft is kept however incomplete). It isn't in this ruling, so I left it alone.

Nothing in this revision needed changes outside `app/` and `docs/decisions/`.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does slice 14 (a vendor can propose on a Code With Us opportunity) do what its criteria say? Ruling: return. Verify is unbound for this tree (80f368e): 18 of 25 criteria pass, R-2.13 among them, so the no-proponent-chosen fix holds. The other 7 established nothing. The gaps have two causes. (1) Code With Us screens the slice was asked for and did not build: the router registers only /opportunities/code-with-us/$opportunityId/proposals/create and .../$proposalId/edit, with no read-only proposal page at .../proposals/:proposalId (R-2.24 'a vendor never sees another vendor's proposal'), and the Code With Us opportunity management screen has no Proposals tab (R-1.31 and R-2.25, Code With Us cases). (2) The plan gave a Code With Us-only slice criteria that span all three programs. R-2.7, R-2.9, R-2.11, R-2.24 and the Sprint With Us cases of R-1.31 and R-2.25 need the Sprint With Us and Team With Us proposal screens, which the proposals module says arrive in slice 15. R-8.20 needs attachments on Sprint With Us and Team With Us opportunities, which the app says it does not offer and no slice builds. Rebuilding this slice cannot close group (2). The ruling changes when build adds the two Code With Us screens and the plan re-scopes group (2), and a current verify then passes.

**Conditions:**
- Add the read-only Code With Us proposal page at /opportunities/code-with-us/:opportunityId/proposals/:proposalId (app/frontend/src/router.tsx and a proposal-cwu-view screen). Its author, and anyone who owns or administers its organization, can read it; any other vendor is refused. Verify reported proposal-cwu-view.open unbound for R-2.24.
- Add a Proposals tab to the Code With Us opportunity management screen (/opportunities/code-with-us/:id/edit?tab=proposals). It refuses staff and administrators until the opportunity has closed, then lists the submitted proposals and never a draft, using the existing GET /api/proposals/code-with-us?opportunity=. Verify reported opportunity-cwu-edit.proposals_tab unbound for R-1.31 and R-2.25.
- app/backend/src/proposals/prisma-cwu-proposal.store.ts: in create and update, write null to proponentOrganization when the organization proponent's value is "". Today a draft saved with 'An organization' chosen but none picked writes an empty string into a uuid foreign-key column, which goes against R-2.12 (a draft is kept however incomplete). Add a unit or end-to-end test that saves that draft and reopens it.
- addressed-to plan: slice 14 builds only Code With Us proposals (Sprint With Us and Team With Us proposals arrive in slice 15), yet it claims R-2.7, R-2.9, R-2.11, R-2.24 and the Sprint With Us and Team With Us cases of R-1.31 and R-2.25, whose tests open proposal-swu-create, proposal-twu-create and opportunity-swu-edit.proposals_tab. Verify reported all of these unbound because those screens belong to a later slice. Move these criteria, or their non-Code With Us cases, to the slice that builds Sprint With Us and Team With Us proposals.
- addressed-to plan: slice 14 claims R-8.20, whose test cases attach files to Sprint With Us and Team With Us opportunities. The new app has no attachments on those opportunities ('Files cannot be attached to a Sprint With Us opportunity in this version of the service'), and slice 14 does not build them. Verify reported file-attachment-control.add_attachment unbound for both cases. Assign R-8.20 to a slice that builds attachments on Sprint With Us and Team With Us opportunities, or add that work to a slice explicitly.
