| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T23:15:58.596Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 10 (Staff can create Sprint With Us and Team With Us opportunities with an evaluation panel) do what its criteria say?

**Recommendation.** I fixed the question limit (R-1.17).

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed the question limit (R-1.17). For the R-1.53 failure, I found nothing in the application that would cause it. `npm --prefix app run check` passes: the typecheck plus 16 migration, 487 backend and 314 frontend unit tests.

**R-1.17: up to 101 evaluation questions.** A question's position runs from 0 to 100, so 101 questions are valid. Questions used to share the limit of 100 with resources and panel members. They now have their own limit, `QUESTIONS_MAX = 101`, in `backend/src/rules/other-program-drafts.ts`, and the shared limit for resources and the panel stays at 100. The new limit is used in three places:
- **The service:** it accepts 101 questions and refuses a 102nd with a message under the program's questions field (`teamQuestions` or `resourceQuestions`), saying "Add no more than 101 …".
- **Drafts:** a saved draft keeps up to 101 questions, so a draft follows the same limit.
- **The form:** the "add a team question" or "add a resource question" button disables only once 101 questions are on the form, and the hint says "You can add up to 101".

New unit tests check that 101 questions are accepted and 102 refused in both programs, that a draft keeps 101, and that on the Sprint With Us create form the add button stays enabled until there are 101 questions and is then disabled. That form test takes about 20 seconds, so I gave it a two-minute limit.

**R-1.53: an administrator deleting a Sprint With Us draft.** I went through the whole path and could not find a fault in the application:
- **The picture of the failed page:** it shows the administrator's dashboard with no draft created by the test. Every row is a seeded opportunity dated August 3, 2026 or earlier, and the list puts the newest first. So when the picture was taken, the title the test was waiting on had already gone.
- **Who may delete:** the shared rule lets an administrator delete any draft or opportunity under review, the same for both programs.
- **The service:** a new end-to-end test against the real service has an administrator delete three Sprint With Us drafts: a bare one of their own, a complete one of their own, and one a staff member created. Each is answered 200 and is no longer in the administrator's list afterwards.
- **The screen:** a new frontend test opens the manage page of a sparse Sprint With Us draft as an administrator. The Delete button is offered, confirming it sends the delete, and the page moves to `/dashboard`. The dashboard loads the list fresh each time it opens, so the draft is gone.

My conclusion is that this failure is not the application's. It is most likely in how the test or its adapter decides that the title has left the list, but I could not see the test to confirm that.

**Left to other stages.** The ruling sent four items elsewhere, and I left them alone:
- The Team With Us "Maximum budget" label (R-1.13) and the manage page's questions section (R-1.17 draft cases) are for the bind-adapter stage.
- Reading R-1.56's description after the save rather than from the edit form is also for the bind-adapter stage.
- R-5.16's consensus clause is a plan sequencing question.

As before, R-7.29 cannot be tested here, because R-7.25 forbids removing the page it would need.

**For the next slice.** No new gaps. The 101-question limit now lives in the shared rules and any later screen should use it. Evaluation screens that number questions can count on positions 0 to 100.

No decision record was needed: none of the existing records state the old cap of 100.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does slice 10 do what its criteria say, given that verify failed R-1.17 after three builds and escalated it? Ruling: return. The fault is in the browser driver (the bind-adapter stage's), not in the application or the criterion. Both failing R-1.17 cases broke at R-1.17.spec.ts:100, inside prepareSprintWithUs while adding the first 101 questions, not on the 102nd. The Sprint With Us create form opens with one blank question already on it (questions: [BLANK_QUESTION], opportunity-other-form.tsx:165). The driver's addQuestion (tests/adapters/new/index.ts:4609) always presses 'Add a team question' and never fills that blank row first. After 100 presses the form holds 101 rows and the button correctly disables at QUESTIONS_MAX = 101 (line 807), so the 101st press fails. A person filling the first row and adding 100 more reaches 101 questions, and the service accepts 101 and refuses a 102nd (other-program-content.test.ts). The driver already fills the form's first row for resources before adding more, and questions need the same treatment. The test itself asks only for what R-1.17 says, so it does not overreach. Approval is refused while R-1.17 is failed, and another build would only fail the same way, so the work goes to bind-adapter. Both instructions owed from build-slice-10-3 are met. R-7.29 cannot be reached through the screens because R-7.25 forbids removing a page the service needs, so its test is recorded as owed rather than passed over. What would change the ruling: a re-run of verify with the corrected driver that passes R-1.17 and nothing else failed. If the 101-question case still fails with the blank first row filled, the fault is the application's and the slice goes back to build.

**Conditions:**
- addressed-to bind-adapter: opportunitySwuCreate.addTeamQuestion (and, by the same pattern, opportunityTwuCreate.addResourceQuestion) must fill the form's existing blank question row before pressing 'Add a team question' / 'Add a resource question', as addResource already does for 'Resource 1'. The Sprint With Us and Team With Us create forms open with one blank question (opportunity-other-form.tsx:165, questions: [BLANK_QUESTION]). The driver presses Add for every question, so after 100 presses the form holds 101 rows and the button correctly disables at 101 (QUESTIONS_MAX). Verify on build-slice-10-4 failed both 101-question R-1.17 cases at R-1.17.spec.ts:100, inside the setup loop, with 'the control named /add a team question/ is disabled'. The spec never reached its 102nd question.
- condition-met build-slice-10-3#1: questions have their own limit QUESTIONS_MAX = 101 in app/backend/src/rules/other-program-drafts.ts, separate from LIST_MAX = 100. otherProblems refuses a 102nd question with 'Add no more than 101 …' under teamQuestions/resourceQuestions, draftOf keeps up to 101 questions, and the form's add button disables at QUESTIONS_MAX (opportunity-other-form.tsx:807). Unit tests in app/backend/tests/other-program-content.test.ts cover this.
- condition-met build-slice-10-3#2: R-1.53 passes in verify for build-slice-10-4 (tests/results/new/slice-10.json). Build added an end-to-end case of an administrator deleting their own sparse draft, their own complete draft and a staff member's Sprint With Us draft, plus a frontend test of the manage page's Delete for an administrator.
- missing-test R-7.29: an opportunity whose screen embeds the scope page's body, with that page removed, shown in full with the scope section empty — owed by contract: a seed state in which the embedded page (/content/sprint-with-us-opportunity-scope or /content/team-with-us-terms-and-conditions) is absent. R-7.25 means no path through the screens or the API removes it.
