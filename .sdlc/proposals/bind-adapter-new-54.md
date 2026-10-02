---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I fixed the question-adding actions on both opportunity create forms."
opened: 2026-10-02T23:42:31.954Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I fixed the question-adding actions on both opportunity create forms.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed the question-adding actions on both opportunity create forms. They now use the form's opening blank question instead of pressing "Add" first. I checked this on the running target, but I couldn't run a type check on the edited file because the command needed approval that never came.

**The problem.** The Sprint With Us and Team With Us create forms both open with one blank "Question 1" already there. `opportunitySwuCreate.addTeamQuestion` and `opportunityTwuCreate.addResourceQuestion` pressed "Add a team question" or "Add a resource question" every time they were called. So 100 calls left 101 rows on the form, the button switched off, and both 101-question R-1.17 cases failed during setup before reaching their 102nd question.

**The change.** It is only in `addQuestion` inside the shared form builder in `tests/adapters/new/index.ts`; both actions go through that function. When the form holds exactly one question and its Question and Guideline boxes are both empty, the action fills that row. Otherwise it presses Add as before. This mirrors how `addResource` already treats the blank "Resource 1". The opening row is reused only while it is the only question, so calls that supply no question text still add one row each and the count stays right.

The same builder also drives the two edit forms. There, a saved opportunity whose only question is filled in still gets Add pressed, as before.

**Checked on the target.** Signed in through the identity provider as the administrator persona:
- Both create pages open with a "Team questions" or "Resource questions" section holding one "Question 1" group, its Question and Guideline boxes empty, and the Add button present.
- On the Team With Us form, I ran the new logic in the browser 101 times, filling each question. It left exactly 101 rows, with "Add a resource question" disabled after the 101st. So a test asking for a 102nd question now reaches the form's limit, which the original driver never did.

I didn't run the Sprint With Us version of that loop. It goes through the same code, and its opening state matches.

**Left unchanged.** Everything else in the adapter, and `bindings.yaml`, which already lists `add_team_question` and `add_resource_question` as bound. No file outside `tests/adapters/new/` was touched, and no password or environment value was written anywhere.

**Not done.** A type check of the adapter, because running it needed approval that never came. The edit uses only names and patterns already in the file.

No request was deferred.
