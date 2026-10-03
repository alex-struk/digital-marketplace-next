---
stage: "build"
title: "build slice 10"
at: "2026-10-03T00:23:25.166Z"
cost: 0.220404
turns: 6
session: "905bcc6f-bd0a-488b-8ec7-cf73b2f0f99c"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I made no changes to the application in this revision. The ruling found the fault in the browser driver, not in the application, and named nothing under `app/` to fix.

**Checking the ruling against the code.** I confirmed what the ruling relies on before deciding to leave the application alone.
- The Sprint With Us and Team With Us create forms open with one blank question already on them (`app/frontend/src/screens/opportunity-other-form.tsx:165`).
- The "Add a team question" / "Add a resource question" button disables once the form holds `QUESTIONS_MAX` questions (line 807).
- `QUESTIONS_MAX` is 101 (`app/backend/src/rules/other-program-drafts.ts:62`). The service refuses anything over that limit, naming the questions field (`other-program-content.ts:384`).

That matches R-1.17: a question's position runs from 0 to 100, so 101 questions is the most an opportunity can hold. Someone who fills the first row and adds 100 more reaches exactly 101, and the button correctly stops them at 102. The two failed R-1.17 cases stopped while the test was still adding its first 101 questions, because the driver presses Add for every question and never fills the blank first row. If I loosened the cap or opened the form without a blank row, the application would no longer match the criterion or the design, so I did neither.

**Check.** At first `npm --prefix app run check` failed because the workspace had no dependencies installed (`tsc: not found`). After `npm ci` under `app/` it passed:
- 16 tests in 2 files
- 487 tests in 33 files
- 314 tests in 19 files

These include the service tests showing 101 questions accepted and a 102nd refused. One mail-delivery error appears in the log, but it comes from a test that simulates a failed delivery on purpose; nothing failed.

**Not mine to do.** These two conditions in the ruling are addressed to other stages, and I left them alone:
- **Browser driver:** filling the form's existing blank question row before pressing "Add a team question" or "Add a resource question" belongs to whoever binds the driver, the same way it already fills "Resource 1".
- **Seed state for R-7.29:** this criterion needs an opportunity shown in full with its scope section empty because the embedded scope page has been removed. That seed state belongs to the contract stage, because R-7.25 means no path through the screens or the API can remove that page.

The application already shows an empty scope section, without breaking the view, when the embedded page is missing. That behaviour can only be tested once the contract stage supplies that state.

**What would change this.** If verify still fails the 101-question case once the driver fills the blank row first, the fault is the application's and the slice should come back to build.