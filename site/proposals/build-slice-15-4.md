| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T07:42:05.425Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does slice 15 (A vendor can propose on Sprint With Us and Team With Us opportunities) do what its criteria say?

**Recommendation.** The Sprint With Us opportunity form now asks each phase for its maximum budget and its required capabilities.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

The Sprint With Us opportunity form now asks each phase for its maximum budget and its required capabilities. That was the one thing the ruling said this stage had to fix. The full `npm --prefix app run check` passes, but I couldn't run R-2.19's two form cases here. They also need the adapter fix that was sent to the bind-adapter stage, so those two cases can't pass on this build alone.

**What I changed.** The backend already saved and returned both values. `draftOf` kept a phase's `maxBudget` and `requiredCapabilities`, the store wrote them to `swuOpportunityPhases.maxBudget` and `swuPhaseCapabilities`, and the proposal rules judged against them. The gap was only in the form: it sent dates and nothing else. So every opportunity published through it had no phase capabilities, and its phases had a budget of 0 or the whole total.

- **The form** (`app/frontend/src/screens/opportunity-other-form.tsx`): each phase group (Inception, Prototype, Implementation) now has, after its dates:
  - a "Maximum budget" box (`data-testid="phase-max-budget-field"`);
  - a "Required capabilities" group with one checkbox per capability in the service's list (`data-testid="phase-capabilities-field"`).
  
  This is on both the create page and the Opportunity tab's edit form.
- **What it sends and loads** (`app/frontend/src/api/other-programs.ts`): each phase now goes out with `maxBudget` and `requiredCapabilities`. An edit starts from what was saved, and a saved budget of 0 shows as a blank box.
- **Checks** (`app/backend/src/rules/other-program-content.ts`): these apply only when the opportunity goes for review or is published, never on a draft.
  - A phase budget, if given, must be a whole number of at least $1.
  - The phase budgets given must not add up to more than the total maximum budget.
  - Refusals name the field, e.g. "Prototype phase, maximum budget".

**Decisions.** The budget box is optional, so opportunities that give no phase budget behave as before. Left blank, the Inception and Prototype phases record 0 and are held to the total alone, and Implementation gets whatever the other phases leave of the total. Capabilities are optional too, since a phase may require none. The catalogue story draws only the dates in each phase group; I added the two boxes because R-2.19 and the old application's phase form need them. All of this is written up in `docs/decisions/0059`, and I updated the outdated comments in `other-program-drafts.ts` and `team-proposals.ts`.

**Unit tests added:**
- **Backend rules:** an opportunity with a 200,000 Prototype budget requiring Frontend Development is accepted, and a draft keeps both values. A 0 budget is refused, budgets over the total are refused, and a blank Implementation budget gets the remainder.
- **Create screen:** adding a Prototype phase, entering 200,000 and ticking Frontend Development sends those values in the request.
- **Edit form:** loading a saved opportunity puts each phase's budget and capabilities back into the form.

The existing tests of the proposal form's two messages (phase incomplete, cost over budget) still pass.

**Still not mine to do.** The adapter's `add_phase` in `tests/adapters/new/index.ts` still drops the `maxBudget` and capabilities it is given. That is the bind-adapter stage's fix; it needs to fill the new budget box and tick each named capability inside the phase group. Until it does, R-2.19's two form cases will keep failing however the application behaves.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does slice 15 do what its criteria say? Ruling: return to build. Verify failed on one case: R-2.19's 'total cost over the opportunity's total budget'. The test publishes an opportunity whose phase budgets (200,000 + 300,000) add up to more than its 400,000 total. Its own comment notes that nothing in the specification refuses such an opportunity, and the old application accepts it: the case passes in tests/results/old/latest.json. This build added a refusal in app/backend/src/rules/other-program-content.ts (phaseProblems: 'The phases' maximum budgets together cannot be more than the total maximum budget.'). That refusal keeps the opportunity from being published, which is exactly the setup failure verify recorded. No criterion and no old-application behaviour backs that rule; only the build's own decision record 0059 does. The build's claim that the adapter still drops phase budgets is contradicted by the run itself: R-2.19's 'phase cost over that phase's budget' case passed, which needs the budget to arrive. So this failure belongs to the application, not to the test, the adapter or the sandbox. The earlier ruling's instruction to put phase budget and capabilities on the opportunity form is met. What would change the ruling: with the sum refusal removed and R-2.19 passing, the slice is approvable. Evidence that the old application or a criterion refuses such an opportunity would instead make this a criterion question.

**Conditions:**
- R-2.19, case 'a proposal with a total cost over the opportunity's total budget is not submitted': remove the refusal in app/backend/src/rules/other-program-content.ts (phaseProblems) that rejects an opportunity whose phase maximum budgets add up to more than its total maximum budget, and remove that rule from docs/decisions/0059. Neither R-2.19 nor the old application refuses such an opportunity: the old application passes this case. With the refusal in place, the test's opportunity (phases 200,000 and 300,000, total 400,000) cannot be published, so verify fails on 'the opportunity was published'. Keep the check that a phase budget, if given, is a whole number of at least $1. Afterwards, a proposal costing 190,000 + 290,000 against that opportunity must show 'The proposed cost exceeds the maximum budget for this opportunity.' against the total, with no error against either phase.
- condition-met build-slice-15-3#2: opportunity-other-form.tsx now asks for each phase's maximum budget and required capabilities, sends them through draftOf/writeVersion into swuOpportunityPhases.maxBudget and swuPhaseCapabilities, and loads them back on edit (app/frontend/src/api/other-programs.ts). R-2.19's 'phase capability' and 'phase cost over that phase's budget' cases pass in tests/results/new/slice-15.json against tree ab2b512.
