---
gate: G3
question: "Does slice 15 (A vendor can propose on Sprint With Us and Team With Us opportunities) do what its criteria say?"
recommendation: "I built slice 15: Sprint With Us and Team With Us proposals from end to end, the Proposals tab on those two programs' manage pages, and attachments on their opportunities."
opened: 2026-10-04T05:29:53.117Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does slice 15 (A vendor can propose on Sprint With Us and Team With Us opportunities) do what its criteria say?

**Recommendation.** I built slice 15: Sprint With Us and Team With Us proposals from end to end, the Proposals tab on those two programs' manage pages, and attachments on their opportunities.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I built slice 15: Sprint With Us and Team With Us proposals from end to end, the Proposals tab on those two programs' manage pages, and attachments on their opportunities. `npm --prefix app run check` passes: 16 migrations tests, 675 backend tests and 434 frontend tests. I couldn't start the sandbox or open a page, so none of this has been seen running in a browser.

**What was built, by criterion**

- **R-2.7, R-2.9, R-2.11, R-2.24 (now covering all three programs).** `/api/proposals/sprint-with-us` and `/api/proposals/team-with-us` are new. They use the same reading and managing rules as Code With Us.
  - A proposal can only be created as a draft or a submission.
  - Each vendor gets one proposal per opportunity, and so does each organization. A refusal comes back with the identifier of the proposal that already exists.
  - A proposal's history is shown to its author and to the owners and administrators of its organization.
  - No vendor can see another vendor's proposals.
  - The vendor dashboard now lists all three programs together. Each row names its program and links to that program's manage page.
- **R-1.31, R-2.25.** Both programs' manage pages have a Proposals tab once the opportunity is past draft. The service refuses the list to staff until the deadline has passed, and drafts are never shown.
- **R-2.16 to R-2.21.** The new rules module (`backend/src/rules/team-proposals.ts`) is shared by the service and the screens. It checks:
  - organization qualification, worked out again at the moment of submission;
  - the opportunity's service areas (Team With Us);
  - a team for each of the opportunity's phases and no other, with exactly one scrum master each;
  - that everyone named is an active member, and nobody is named twice (Team With Us);
  - phase and total costs against their budgets;
  - capabilities, hourly rates, resources, and answers against each question's word limit.

  The refusal wording is what the surface specifies.
- **R-2.10.** Team With Us rates are checked against the opportunity's maximum budget on every create and edit, drafts included.
- **R-2.22.** Once a proposal is submitted, its organization can't change until it is withdrawn.
- **R-8.19, R-8.20, R-8.25.** A migration restores `swuOpportunityAttachments` and `twuOpportunityAttachments`. A single new read path replaces the Code With Us-only one and serves opportunity attachments in all three programs. The proposal read path now covers Sprint With Us as well. The attachment control is turned on in both programs' opportunity forms, and their public pages list the attachments.

**Screens.** There are new create and manage pages for both programs, built on one shared form. A "Start a proposal" link now appears on both programs' public opportunity pages. The Sprint With Us form shows, as the team is named:
- what each phase still lacks;
- members whose invitation is still pending, marked as pending;
- each required capability, held or not;
- cost errors and the running total.

Submit stays unavailable while any of that is unresolved. The Team With Us form estimates the cost over the contract and shows the service areas the organization doesn't provide. The terms dialog is worded for each program.

**Tests.** Backend: an end-to-end file runs against the migrated schema with the seed applied, and a unit file covers the rules. Frontend: screen tests, including an accessibility (axe) scan. I updated one existing test because opportunity drafts now carry attachments.

**Choices recorded in decision record 0058**
- **A new table the plan doesn't name.** The surface puts an attachment control on the Sprint With Us proposal form, but the kept schema has nowhere to store those files. I restored a third table, `swuProposalAttachments`, following the old application's pattern for the other two programs. This goes beyond the restores the plan lists.
- **Scrum master is a radio choice per phase, not a checkbox.** R-2.19 and the surface require a single choice; the stories draw checkboxes. The design stage should bring the stories into line.
- **Budget formula for Team With Us is my own reading.** The criterion only says "across the contract period". I used hourly rate × target allocation × 7.5 hours × working days from start to completion. If the test uses a different formula, cases near the budget limit will disagree.
- **Phase budget of 0 means "no phase maximum".** The opportunity form only asks for a total budget, so inception and prototype phases created through it are stored with a maximum of 0. I treat that as no cap on the phase, only the total.
- **A person named twice in one Sprint With Us phase gets a 503**, as the old service failed to store it, rather than a validation refusal.

**Not built, and what's missing for later slices**
- **Phase capabilities can't be set through the opportunity form.** That form (Slice 10's, and its design) has no field for them, so only seeded opportunities or direct requests carry them. A screen test that creates an opportunity and expects a capability gap will find no required capabilities. Fixing that is a design change, not this stage's.
- **The "closed" half of R-1.31 and R-2.25 depends on the deadline,** not a closing hook, which is Slice 16. It works on the seeded lapsed opportunities.
- **Left to later slices:** the Scoresheet tab, scores and rank, the read-only Sprint/Team With Us proposal pages (so the Proposals tab rows aren't links), exports, and the submission and withdrawal emails.

**Housekeeping.** I ran `npm ci` because the workspace had no installed packages, so `app/node_modules` and the workspace `node_modules` folders now exist. I deleted the `dist` folders my build check created.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Does slice 15 do what its criteria say? Verify is fail, so this cannot be approved; on sorting, most failures are the adapter's, not the application's. R-1.31 and the first R-2.25 case read the Code With Us Proposals tab, which correctly withholds the proposals with a 'not shown until the opportunity closes' message; the adapter's proposalsTab() returns that refusal text as if it were content. All twelve R-2.19 cases fail because opportunitySwuCreate.publish typed the opportunity's overall completion date (day 90) into the first 'Completion date' box, the prototype phase's, so the form correctly refused publication (implementation starting before prototype ends) and no identifier was read. The unbound create/edit members for both programs were bound against a build that did not serve those routes, and this branch's router.tsx now adds them. The application's own failure is the second R-2.25 case: once the opportunity closes, the opportunity's author or an administrator cannot open a submitted Sprint With Us proposal, because the slice deferred the read-only proposal pages. A rebound adapter and that page, with a current verify result, would change the ruling.

**Conditions:**
- addressed-to bind-adapter: R-1.31, R-2.25: opportunityCwuEdit.proposalsTab() returned the whole Proposals section text, "Proposals Proposals are not shown until the opportunity closes … can be read once it has closed to proposals, at …", at /opportunities/code-with-us/<id>/edit?tab=proposals for public sector staff and the administrator. The page shows the refusal and no proposals; the binding must answer empty when the section withholds proposals and lists none, not return the refusal message as content (evidence .sdlc/evidence/slice-15/R-1.31.txt, R-2.25.txt).
- addressed-to bind-adapter: R-2.19: opportunitySwuCreate.publish({ completionDate: inDays(90) }) filled the opportunity-level completion date into the first box labelled 'Completion date' on /opportunities/sprint-with-us/create, which is the Prototype phase group's. The page outline shows the prototype completion as 2027-01-02 where addPhase had set inDays(60), so the form refused with 'the implementation phase cannot start before the phase before it ends' and opportunitySwuEdit.opportunityIdentifier() read "". Publish must not write phase-group date boxes; a Sprint With Us form's dates belong to the phase groups (evidence .sdlc/evidence/slice-15/R-2.19.txt).
- addressed-to bind-adapter: R-2.7, R-2.9, R-2.10, R-2.11, R-2.16, R-2.18, R-2.20, R-2.22, R-2.24: proposal-swu-create.*, proposal-twu-create.*, proposal-swu-edit.* and proposal-twu-edit.* (choose_organization, start_editing, withdraw_proposal and the rest) are reported unbound with the reason that the running build serves only /dashboard, /opportunities and the account screens. This build serves /opportunities/sprint-with-us/:opportunityId/proposals/create, /opportunities/team-with-us/:opportunityId/proposals/create and both programs' /proposals/:proposalId/edit (app/frontend/src/router.tsx), with an organization chooser, team sections and submit/withdraw actions; bind them against it. proposal-cwu-view.open, used by R-2.24, is also reported unbound although that page was already served before this slice.
- R-2.25, in the case "once the opportunity has closed, its submitted proposals are shown to the opportunity's author and to an administrator": Error: unbound: proposal-swu-view.open — /opportunities/sprint-with-us/:opportunityId/proposals/:proposalId is offered only to a signed-in person, and walked signed in (as the administrator, as a public sector employee, and as a vendor for a vendor's screens — the seeded organization owner, an organization member and the invited vendor for the or… — at tests/acceptance/proposals/R-2.25.spec.ts:114. The slice claims R-2.25 but deferred the read-only Sprint With Us and Team With Us proposal pages; build them in app/frontend (the Proposals tab rows linking to them) so a submitted proposal can be opened by the opportunity's author and an administrator once the opportunity has closed, and never a draft.
