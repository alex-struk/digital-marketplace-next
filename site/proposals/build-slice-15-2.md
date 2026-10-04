| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T06:29:04.980Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does slice 15 (A vendor can propose on Sprint With Us and Team With Us opportunities) do what its criteria say?

**Recommendation.** I built the read-only Sprint With Us and Team With Us proposal pages, which were the one failure the ruling held against the application (the second R-2.25 case).

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I built the read-only Sprint With Us and Team With Us proposal pages, which were the one failure the ruling held against the application (the second R-2.25 case). The Proposals tab on both programs' manage pages now opens each proposal on its page. `npm --prefix app run check` passes: typecheck plus every unit test, 1,129 in total across the three test packages. I have no new acceptance (verify) result. That suite runs after this stage, and without its own fix the adapter will still report this page as unbound.

**What failed.** Once a Sprint With Us opportunity had closed, its author or an administrator who opened a submitted proposal's address got "Page not found". That is what `.sdlc/evidence/slice-15/R-2.25-2.txt` shows. Only the vendor's manage page (`/proposals/:proposalId/edit`) existed for these two programs. The service was already right: it lets staff read a proposal only once the opportunity has closed, and never a draft. So the fix was frontend only.

**What I changed:**
- **New page**, `app/frontend/src/screens/proposal-team-view.tsx`, used by both programs. It is offered only to a signed-in person and shows:
  - the proponent's name, the opportunity link, the status, when it was submitted and the proposal ID;
  - a Proposal tab, which reuses the manage page's read-only details: organization, phase teams and costs (or the Team With Us team by resource with hourly rates), question responses, references and attachments;
  - a History tab;
  - a "Printable copy" link.

  It carries the catalogue's test_ids for these (`proposal-proponent-name`, `proposal-identifier`, `proposal-status`, `proposal-tab-proposal`, `proposal-tab-history`, `proposal-export-link`). Staff also get the missing page for a draft, even if the service sends one. Anyone the service refuses gets the missing page, as does a proposal reached through another opportunity's address. A vendor who may read it also sees a "Manage this proposal" link. It follows the existing Code With Us read-only page.
- **Routes**: `app/frontend/src/router.tsx` now serves `/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId` and the Team With Us equivalent. The router still matches `/proposals/create` before the proposal-ID routes.
- **Proposals tab**: `opportunity-cwu-proposals-tab.tsx`, shared by all three programs, now links every row to its program's page. Before, only Code With Us rows were links.

**Tests**, in `app/frontend/tests/team-proposals.test.tsx`:
- staff open a submitted Sprint With Us proposal on a closed opportunity and see its proponent, status, identifier and team, with no manage or edit controls, and an automated accessibility check finds nothing;
- the History tab;
- the missing page for a proposal the service refuses, for a draft sent to staff, and through another opportunity's address;
- a vendor's Team With Us view, with its team by resource, hourly rate and the manage link;
- the Sprint With Us Proposals tab row linking to the new page.

**Left for later slices.** The page has no score panel, no Team questions, Code challenge, Team scenario, Resource questions or Challenge tabs, and no award or disqualify actions. The catalogue's stories show all of these, but they belong to the evaluation slices. The printable-copy link points at the export pages, which no slice has built yet; the Code With Us page has the same gap. The page names the proponent by organization, matching the Proposals tab. The catalogue shows staff an anonymous "Proponent N" name, which the service already returns; showing it is for the evaluation slices.

**Not mine to do.** The ruling sent three conditions to the stage that binds the acceptance tests to the pages, so I left them alone:
- The Code With Us Proposals tab binding returns the "not shown until the opportunity closes" message as if it were content (R-1.31, R-2.25).
- The Sprint With Us publish step types the opportunity's overall completion date into the prototype phase's box (all twelve R-2.19 cases).
- The proposal create and manage pages for both programs, and the Code With Us read-only page, are reported unbound even though this build serves them.

That stage also needs to bind the new `proposal-swu-view` and `proposal-twu-view` pages; until it does, the second R-2.25 case cannot pass.

I changed nothing outside `app/` and added no decision record. The page reuses existing components and follows the pattern recorded in decision 0058.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Does slice 15 do what its criteria say? Verify is fail, so it cannot be approved. After sorting the failures, one is the application's, two are the adapter's and one is a test that asks for more than its criterion. The application's: the Sprint With Us proposal form's references ask only for Name, Email address and Phone number (optional), with no Company box (app/frontend/src/screens/proposal-team-form.tsx:949-968), although the service stores and reads `company` and the old app asked for it. Every UI-driven Sprint With Us test stops at addReference, so this one gap leaves R-2.7, R-2.9, R-2.11, R-2.16, R-2.18, R-2.22 and R-2.19's main case, and probably its six undescribed cases, unexercised. The adapter's: in R-2.19's two by-request cases the service refused correctly ('inceptionPhase: This opportunity does not require this phase.', 'prototypePhase: This opportunity requires this phase.'), but refusalByField hands the test the raw field key, which never matches the phase name the test looks for. The test's: R-2.10's edit-path case expects an over-budget Team With Us proposal to be kept by 'Save draft'. R-2.10 asks for the budget check on the create and edit paths and says nothing that exempts drafts, and R-2.12 exempts incomplete (blank) fields, not a budget breach. The create page refused it correctly ('Cost: The proposed cost exceeds the maximum budget for this opportunity.', evidence R-2.10.txt). The read-only Sprint With Us and Team With Us proposal pages the previous ruling asked for are now built and routed, with the Proposals tab linking to them. R-2.25 is unbound only because the adapter has not been bound against them. A Company box on references, a rebound adapter, a re-derived R-2.10 edit-path test and a current verify result would change the ruling.

**Conditions:**
- R-2.19, in the case "a proposal meeting every rule is submitted": Error: unbound: proposal-swu-create.add_reference — no box on "Reference N" takes "company" (each reference has Name, Email address and Phone number (optional)) on http://localhost:4300/opportunities/sprint-with-us/61d2336e-178f-4582-8176-bf34445e0193/proposals/create — at tests/acceptance/proposals/R-2.19.spec.ts:182. Each Sprint With Us reference in app/frontend/src/screens/proposal-team-form.tsx must take a Company, as the service (ReferenceInput.company, swuProposalReferences.company) and the old application's reference form do; the same missing box stops R-2.7, R-2.9, R-2.11, R-2.16, R-2.18 and R-2.22's Sprint With Us cases at addReference.
- addressed-to bind-adapter: R-2.19: in the cases "a team for a phase the opportunity does not have is not submitted" and "a proposal leaving out a phase the opportunity has is not submitted", proposalTeamRequest.refusalByField() returned the service's raw lines 'inceptionPhase: This opportunity does not require this phase.' and 'prototypePhase: This opportunity requires this phase.' The service names the phase by its request field key (inceptionPhase, prototypePhase, implementationPhase); the binding must report each entry against the phase's name (Inception, Prototype, Implementation) so the refusal reads as standing against that phase (evidence .sdlc/evidence/slice-15/R-2.19-2.txt, R-2.19-3.txt).
- addressed-to bind-adapter: R-2.25: proposal-swu-view (and proposal-twu-view) are reported unbound with the reason that the running build serves a signed-in person only /dashboard and similar. This build serves /opportunities/sprint-with-us/:opportunityId/proposals/:proposalId and the Team With Us equivalent (app/frontend/src/router.tsx, screen proposal-team-view.tsx), reached from each row of the opportunity manage page's Proposals tab, with proposal-proponent-name, proposal-identifier, proposal-status, proposal-tab-proposal, proposal-tab-history and proposal-export-link; bind them against it.
- test-overreaches R-2.10: the edit-path case requires that a Team With Us proposal whose hourly rates already exceed the opportunity's maximum budget be stored by 'Save draft' before the edit path is tried. R-2.10 asks for the budget check on both the create and the edit path and exempts no draft, and R-2.12 exempts incomplete or blank fields, not a budget breach, so the criterion does not ask for an over-budget draft to be kept. The edit path has to be reached from a proposal saved within budget and then edited over it.
- condition-met build-slice-15#4: the read-only Sprint With Us and Team With Us proposal pages are built at app/frontend/src/screens/proposal-team-view.tsx and routed in app/frontend/src/router.tsx, with every row of the shared Proposals tab (opportunity-cwu-proposals-tab.tsx) linking to its program's page. Staff get the missing page for a draft or a refused proposal (app/frontend/tests/team-proposals.test.tsx). Binding the acceptance test to the page is addressed to bind-adapter.
