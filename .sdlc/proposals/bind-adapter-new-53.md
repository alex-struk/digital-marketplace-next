---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I couldn't typecheck them: both attempts to run `tsc` on the tests project were refused permission."
opened: 2026-10-02T23:07:05.749Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I couldn't typecheck them: both attempts to run `tsc` on the tests project were refused permission.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've made all three corrections in `tests/adapters/new/`. I couldn't typecheck them: both attempts to run `tsc` on the tests project were refused permission. I did run the new reader's page logic in the browser against the live target, and it returned the saved values. Nothing else in the adapter was changed.

**1. Team With Us maximum budget.** The opportunity page now shows the figure as "$300,000" under a "Maximum budget" term; the old "Maximum Contract Value" label is gone. `opportunityTwuView.maxBudget` now reads the value under "Maximum budget" first, and falls back to the old label only if that term isn't there. It still throws `unbound:` when the opportunity doesn't open. Its bindings entry was already `bound` and stays so.

**2. Team and resource questions after saving a draft.** The manage screen still has no section called "Team questions" or "Resource questions". On this build, though, its Opportunity section is always the program's editable form, published opportunities included, and the questions sit in it as their own section. The old reader would never have found them, because a form's typed values are not part of its page text; the page text is only the labels.

I added a reader, `savedForm`, to the shared manage-screen code. It opens the Opportunity section and reloads the page, so the boxes show what was saved rather than anything typed and left unsaved. It then reads the form in order, putting each box's value under its label and marking ticked choices with "[x]".
- `teamQuestionsTab` (Sprint With Us) and `resourceQuestionsTab` (Team With Us) now read just the questions section of that form. If the form has no such section, they return empty.
- In `bindings.yaml`, `team_questions_tab` and `resource_questions_tab` are now `bound`, replacing their old `unbound` reasons.

I checked this by signing in as the administrator, saving a Sprint With Us draft with a question whose word limit was 5000, and reopening its Opportunity section. The form held the question and "5,000", which the reader returns. I then deleted that draft through its own "Delete" and "Delete opportunity" controls. I also checked the reader on the seeded closed Team With Us opportunity, where it reads all four seeded resource questions with their scores and word limits.

**3. Description after an administrator edits a published opportunity.** `opportunityTab` on both the Sprint With Us and Team With Us manage pages now uses the same reader. After an edit is saved it reloads the page and reads the saved form with its values, including the description under "Description (required)". Before, it returned only the form's labels. Both entries were already `bound`.

**R-5.16 (scoring a question in an individual evaluation).** This stays unbound with its existing reason. Signed in as the administrator, I opened the route with the seeded Sprint With Us opportunity at "Questions: individual evaluation" and its evaluated proposal, and it still answers "Page not found". The manage screens I opened during this run still list only Summary, Opportunity, Addenda, History and Evaluation panel.

Every page I opened during this run resolved. I touched nothing outside `tests/adapters/new/`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does this adapter bind every surface action and observation on new, and nothing else? Approve. The diff touches only tests/adapters/new and the pipeline's own records; nothing under tests/acceptance changed, and the runner's typecheck on this revision passed with no diagnostics under adapters/new. The changes are navigation and reading only: savedForm opens the Opportunity section, reloads so the boxes hold saved values, and serialises the form's labels with their values (ticked choices marked), optionally narrowed to one named sub-section; it decides nothing about pass or fail, and returning empty where the form has no such sub-section is an accurate observation rather than a hidden missing surface. teamQuestionsTab and resourceQuestionsTab move from unbound to bound on that reader, which is justified because the questions do appear in the saved Opportunity form; opportunityTab reads the saved form rather than the edit form's labels; maxBudget reads the 'Maximum budget' term with the old label as fallback. These answer the three revision requests build-slice-10-3 addressed to bind-adapter. R-5.16 stays unbound with a real reason (the individual-evaluation route answers 'Page not found'), and its consensus clause is already with plan. The build-owed instructions build-slice-10-3#1 and #2 are not settled here and stay open. What would change this: a verify run showing these readers return something other than the saved values, or a test that relies on reading unsaved input, which the reload in savedForm discards.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `2d1a7bcbd4a3d7866a61004f4527c7b0a5e01ae4`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
