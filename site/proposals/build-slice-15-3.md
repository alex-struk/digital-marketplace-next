| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T07:12:33.423Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does slice 15 (A vendor can propose on Sprint With Us and Team With Us opportunities) do what its criteria say?

**Recommendation.** I added the missing Company box to each Sprint With Us reference, which is the one fix this revision asked of the application.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I added the missing Company box to each Sprint With Us reference, which is the one fix this revision asked of the application. The full check (`npm --prefix app run check`) now passes: typecheck plus 1,130 unit tests across the migrations, backend and frontend packages. I did not run the acceptance suite or open the page in a browser, because neither is possible here.

**What was wrong.** The Sprint With Us proposal form's reference section asked only for Name, Email address and Phone number (optional). The service already took and stored a company for each reference, and the form already kept an empty company for each new reference. There was simply no box to fill it in. Every Sprint With Us test driven through the screen got stuck adding a reference. That covered the main case of R-2.19 and the Sprint With Us cases of R-2.7, R-2.9, R-2.11, R-2.16, R-2.18 and R-2.22.

**What I changed.** In `app/frontend/src/screens/proposal-team-form.tsx`, each "Reference N" group now has a text box labelled "Company", between Name and Email address, like the old application's reference form. It updates the reference's company, which the existing request already sends to the service. It also shows any error the service reports against `references.N.company`.

I left the service as it was. It still does not require a company: making the field required was not part of the ruling and could start refusing drafts that are accepted today.

**Unit test.** I added a case to `app/frontend/tests/team-proposals.test.tsx`. On the Sprint With Us create page it adds a reference, finds the Name, Company, Email address and Phone number boxes inside the "Reference 1" group, and fills them in. It then saves a draft and checks that the request to the service carries all four values, company included. All 18 tests in that file pass.

**Three conditions in the ruling belong to other stages, and I left them alone:**
- **R-2.19's two by-request cases:** the adapter needs to report each refusal against the phase's name (Inception, Prototype, Implementation) rather than the service's field key.
- **R-2.25:** the adapter needs to be bound against the read-only Sprint With Us and Team With Us proposal pages, which this build already serves.
- **R-2.10's edit-path test:** it needs to be re-derived so the proposal is saved within budget first and then edited over it. The application's refusal of an over-budget Team With Us proposal is correct under R-2.10.

Nothing else in the slice was touched, and I found no new gaps for the next slice.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does slice 15 do what its 17 claimed criteria say? Ruling: return. Verify passes 16 of 17, and the Sprint With Us reference Company box closes build-slice-15-2#1 (R-2.7, R-2.9, R-2.11, R-2.16, R-2.18 and R-2.22 now pass). R-2.19 still fails, and the proposal's account of why is wrong: it names the by-request cases and blames the adapter's refusal field keys, but the failing cases are the two form cases. In one, a phase lacking a required capability should show as incomplete; in the other, the Prototype cost should show as over its 200,000 phase budget. The proposal form shows neither. That traces upstream. The Sprint With Us opportunity form never asks for a phase's maximum budget or required capabilities: other-program-drafts.ts says the form 'does not ask for them', and swuCostProblems treats a phase budget of 0 as 'held to the total alone'. The new adapter's opportunity-swu-create add_phase (tests/adapters/new/index.ts:4830-4856) fills only the start and completion dates and drops the maxBudget and capabilities the test passes. So every opportunity those tests publish carries no per-phase capability or budget, and the proposal form has nothing to judge against. The old application's phase form records both (swuOpportunityPhases.maxBudget, swuPhaseCapabilities), so the criterion and the tests are right. The fix spans build (the opportunity form) and bind-adapter (filling the new boxes), so another build alone would fail verify a fourth time. What would change the ruling: both R-2.19 form cases pass in verify against opportunities whose phases carry a budget and capabilities. If the old application turns out not to record per-phase budget or capabilities, the ruling becomes test-overreaches on those two cases instead.

**Conditions:**
- condition-met build-slice-15-2#1: each Sprint With Us 'Reference N' group in app/frontend/src/screens/proposal-team-form.tsx now has a Company box, sent as references.N.company and covered by a new case in app/frontend/tests/team-proposals.test.tsx; verify for build-slice-15-3 shows R-2.7, R-2.9, R-2.11, R-2.16, R-2.18 and R-2.22 passing.
- R-2.19, in the cases 'a proposal missing a phase capability… the form shows which phase is incomplete' and 'a proposal with a phase cost over that phase's budget… the form shows which cost is over its budget': the Sprint With Us opportunity form (app/frontend/src/screens/opportunity-other-form.tsx and what it sends) must ask, inside each phase group (Inception, Prototype, Implementation), for that phase's maximum budget and its required capabilities, as the old application's phase form does. Each must be saved through draftOf/writeVersion into swuOpportunityPhases.maxBudget and swuPhaseCapabilities and shown again on edit. Then a proposal against a published opportunity with a 200,000 Prototype budget requiring Frontend Development shows the Prototype phase incomplete, naming Frontend Development, when its team lacks that capability, and shows 'Please enter a Proposed Cost less than or equal to 200,000.' against the Prototype cost when it is 250,000. Today both are invisible, because every opportunity published through the form carries no phase capabilities and a phase budget of 0.
- addressed-to bind-adapter: tests/adapters/new/index.ts opportunity-swu-create add_phase (addPhase, around line 4830) fills only startDate and completionDate and silently drops the maxBudget and capabilities its input carries (R-2.19.spec.ts publishSprintOpportunity passes maxBudget 200000/300000 and capabilities ['Frontend Development']/['Backend Development']). It must fill the phase group's maximum budget box and tick each named required capability once the application's opportunity form offers them, and report unbound if a given field has no box rather than dropping it. As things stand, R-2.19's two form cases (phase incomplete for a missing capability; phase cost over its budget) cannot fail or pass on the application's merits.
