| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T22:44:01.568Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 10 (Staff can create Sprint With Us and Team With Us opportunities with an evaluation panel) do what its criteria say?

**Recommendation.** I made no changes in this revision: the ruling returned slice 10 without asking anything of this stage, so the application in `app/` stays as tree b69a691 left it.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made no changes in this revision: the ruling returned slice 10 without asking anything of this stage, so the application in `app/` stays as tree b69a691 left it.

**What the ruling found.** Verify recorded 8 criteria passing and 13 failing, with R-7.29 marked not testable for a sound reason: R-7.25 means the embedded pages can't be removed through the surface. The reviewer checked every failure against its evidence page and the test adapter. None shows the application missing something a criterion needs. Every one is a fault in the adapter or in the plan:

- **Status reading.** The adapter reads an opportunity's status from the line after one that reads exactly "Sprint With Us" or "Team With Us". That is how the original application's header looked. The new view follows the design story and shows the state under a "Status" term (`opportunity-status`). The values were there — Draft, Published, "Team questions: consensus" — but the adapter read nothing.
- **Panel chair.** The adapter's panel setter ignores the top-level `chair` the tests pass. No Chair box gets ticked, so the create form refuses with "Evaluation panel: choose a chair". The form starts with nobody chosen, as its story draws it, so the refusal is correct.
- **Opportunity id.** When a create is refused, the adapter takes "create" as the opportunity's id. It then opens `/opportunities/sprint-with-us/create` as a view, or `/create/edit?tab=evaluationPanel`. This is why R-5.16, R-1.16, R-1.17 and R-5.17 failed.
- **Vendor on the panel (R-1.55, R-5.1).** The chooser correctly doesn't offer the vendor. The adapter notes the refusal and carries on without raising it, but the tests only see a refusal when one is raised.
- **R-1.19.** Its "moves on to a program-specific evaluation stage" case needs the deadline hook, which `plan/tasks.md` line 87 puts in a later slice. That question is filed with the plan stage.

Changing the application to suit these adapter readings would move it away from the design story and from criteria it already meets. It would also take on fixes addressed to the adapter and plan stages, which would then be asked for them again. So I left the 14 conditions filed to those stages alone.

**Check result.** I ran `npm --prefix app run check` against the tree as it stands, after `npm ci`, because the workspace had no dependencies installed. Typechecking passes in all three packages. The unit tests pass: migrations 16 of 16, backend 485 of 485, frontend 312 of 312.

**What still has to happen elsewhere.** Approval of this tree depends on two other stages and a fresh verify run. The adapter needs its four fixes; the plan needs to either move R-1.19 to the slice that delivers the deadline hook, or bring the hook into slice 10. A later slice will still find that hook missing, since it was never part of this slice.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does slice 10 do what its criteria say, given that verify could not tell which failures are the application's? Ruling: return. Most of the remaining failures are the adapter's or the plan's, as the build says, but one is the application's own. R-1.17 makes a question's position run from 0 to 100, so 101 questions are valid. The form disables 'Add a team question' at 100 (opportunity-other-form.tsx:806, LIST_MAX = 100 in rules/other-program-drafts.ts:56), and the service shares that cap, so the tests 'an opportunity holding 101 questions, the last at position 100, is accepted' and 'a question whose position would fall beyond 100 is refused' fail on the application, not the adapter. That defeats the build's account that nothing points at the application. The remaining failures are filed with their stages. The adapter reads the Team With Us budget from the old app's label 'maximum contract value' where the new view says 'Maximum budget' (R-1.13). It treats the manage page's questions section as absent (R-1.17 draft cases). It reads R-1.56's description from the edit form's text. R-5.16's consensus clause can only be reached through the individual-evaluation screen a later slice builds, which is a plan sequencing question. R-1.53 fails only for an administrator deleting a Sprint With Us draft while the neighbouring cases pass, so the build is asked to settle whether that one is the application's. R-7.29's not-testable reason is sound (R-7.25 forbids removing the page it needs), and I do not ask for it to be asserted first. What would change this ruling: a build that accepts 101 questions and refuses a 102nd, and a fresh verify in which every remaining failure is attributable to the adapter or the plan.

**Conditions:**
- R-1.17: let an opportunity hold up to 101 evaluation questions (positions 0 to 100). The add-question button disables only at 101, the service accepts 101 and refuses a 102nd naming the questions field, and a draft follows the same cap. LIST_MAX = 100 is shared with resources and the panel, so give questions their own limit rather than raising the shared one.
- R-1.53: the case 'Sprint With Us: an administrator deletes a draft' timed out waiting for the title to leave the administrator's list, while the under-review and Team With Us cases passed. Check that the manage page offers delete to an administrator on a Sprint With Us draft and that deleting it takes it out of the list. Fix it if it is the application's, and say in the proposal if it is not.
- addressed-to bind-adapter: opportunityTwuView.maxBudget reads the figure under /^maximum contract value$/i, the old application's label. The new view shows it under 'Maximum budget' (data-testid opportunity-max-budget), so R-1.13's 'Team With Us maximum budget has no upper limit' case read an empty string from a published opportunity.
- addressed-to bind-adapter: opportunitySwuEdit.teamQuestionsTab and opportunityTwuEdit.resourceQuestionsTab are bound as absentSection, but the new manage page shows the saved questions on its Opportunity tab. R-1.17's two 'a draft may be saved holding a question outside these limits' cases got an empty string after the draft was saved.
- addressed-to bind-adapter: in R-1.56's 'an administrator changes the details of a published opportunity' case, for both Sprint With Us and Team With Us, the description is read while the page is still showing the edit form ('Opportunity / Overview / Title(required)...'), not the saved opportunity. Read the description from the view (or the manage page after saving) once the edit is saved.
- addressed-to plan: R-5.16's second clause (the panel change is refused once the opportunity has moved to consensus) can only be reached through evaluation-individual-create-swu, which no slice up to 10 builds, so the test came back unbound. Either move R-5.16's consensus clause to the slice that delivers individual question evaluation, or name a seeded opportunity already at consensus as the starting state for slice 10.
