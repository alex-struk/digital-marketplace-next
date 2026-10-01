---
gate: G3
question: "Does slice 3 (A person can keep their own profile, picture and notification choice) do what its criteria say?"
recommendation: "I fixed the profile-picture button so it should now open the file chooser, and reworded the decision record the egress check flagged."
opened: 2026-10-01T02:04:37.012Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 3 (A person can keep their own profile, picture and notification choice) do what its criteria say?

**Recommendation.** I fixed the profile-picture button so it should now open the file chooser, and reworded the decision record the egress check flagged.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed the profile-picture button so it should now open the file chooser, and reworded the decision record the egress check flagged. I could not watch either change work in a real browser, so the picture fix is unconfirmed until the acceptance run.

**What was wrong.** On `/users/me` in edit mode, the "Choose a profile picture" button (`data-testid="change-avatar"`) never opened a file chooser in Chromium. The button is the design system's own Button, wrapped in React Aria's `FileTrigger`. `FileTrigger` passes its click handling down through React context, and that handling evidently never reached the design-system Button, so the hidden file input was never clicked. I didn't trace exactly why (perhaps the design system brings its own copy of React Aria); I removed the dependency instead.

**What I changed.** In `app/frontend/src/app/image-picker.tsx` I removed `FileTrigger`. The picker now has its own hidden file input with a ref. It still accepts only `image/jpeg,image/png`, and it is hidden from keyboard and screen readers. The button's `onPress` calls `click()` on that input. Clicking a file input from a user's press is the standard way to open the browser's chooser, and it is what Playwright waits for. Everything else is unchanged: the button keeps its test id, its `aria-describedby` pointing at the image rule, and its label. A chosen file still goes through the same `onChoose` path. The input is cleared after each choice, so picking the same file again still counts. The same component serves the sign-up completion screen, so the fix covers it too.

**Tests.** I added a unit test in `app/frontend/tests/profile.test.tsx` that presses the button and checks the file input received a click. The old setup never exercised that link. `npm --prefix app run check` passes: typecheck plus 15, 240 and 132 tests across the packages. The workspace had no installed dependencies, so I ran `npm ci` under `app/` first. A jsdom test can't prove a real browser opens its chooser. It does prove the press now reaches the input, which is the link that was broken.

**What I could not do.** The ruling asked for the picker to be watched in the running app. Starting the compose stack needs an approval this session doesn't have, and the workspace has no Playwright or Chromium. So R-8.13, R-8.21, R-8.28 and R-8.30 will first be confirmed in a real browser by the acceptance run.

**Egress fix.** In `docs/decisions/0021-the-file-store-and-its-answers.md` at line 56, "the SHA-256 of the content" now reads "a sha256 digest of the content", so it no longer looks like a ticket number. The meaning is the same.

**Left alone, as the ruling directed.** Three conditions belong to other stages, and I touched none of them:
- **R-8.23 (adapter):** the test fails because the adapter writes a file with a 256-character name to disk, which the filesystem refuses. That needs an adapter change.
- **R-8.17, R-6.6, R-6.16 and R-4.33 (plan):** these need moving to the slices that build their screens.
- **R-4.29 (design):** `design/DESIGN.md` needs bringing into line with the criterion.

Nothing else in slice 3 changed. The next slice will find the file store, the profile and the picker as they were, with only the picker's button wiring different.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether slice 3 does what its criteria say, after runner:verify escalated three failed builds. The ruling is return. What decided it: the verify run against c13c0cc shows the picker change worked. The profile-picture tests of R-8.13 (wide and tall) and R-8.28 now pass in Chromium, and those tests cannot pass unless the chooser opens. So build-slice-3-3#1 is met. Decision record 0021 is gone from the egress failures, so build-slice-3-3#2 is met. The failures that remain are of two kinds. (1) Application faults on the profile picture. R-8.30: after the picker refuses 'portrait.gif', pressing Save changes runs save() in user-profile.tsx, which ignores the pending rejection. It saves the profile and closes the form, so the refusal disappears and the test reads an empty string. R-8.21: checkChosenPicture checks only the name and size, so a '.png' whose content is text is refused only when the form is saved, while the test reads the refusal at choose time. The criterion does not set the timing, but a check of the first bytes in the browser meets the test without contradicting the criterion, and it matches how the picker already copies the service's name and size checks. That is cheaper than regenerating the test. (2) A plan fault. R-8.13, R-8.21, R-8.28 and R-8.30 each have an organization-logo half that is exercised on /organizations/:orgId/edit, which slice 3 does not build, so those halves are unbound or failing whatever build does. R-8.16 cannot be checked from outside the service, but the backend end-to-end suite asserts the upload directory is empty after every upload. I would not hold an approval on it alone. The egress hits that remain are in .sdlc/ ledger and site/ files that build cannot write. One of them is this proposal's own page, which quotes the old wording. If they persist after the app work passes, they are for the pipeline owner. What would change the ruling: the profile-picture halves of R-8.21 and R-8.30 pass in the acceptance run, and the logo halves are moved by plan.

**Conditions:**
- condition-met build-slice-3-3#1: image-picker.tsx now opens a native file input from the button. In the verify run against c13c0cc, Chromium passes the profile-picture tests of R-8.13 (wide and tall) and R-8.28, which need the chooser to open (tests/results/new/slice-3.json).
- condition-met build-slice-3-3#2: docs/decisions/0021-the-file-store-and-its-answers.md no longer appears among the egress E-2 failures on this proposal's checks.
- R-8.30: on /users/me in edit mode, after the picker refuses a chosen picture (for example 'portrait.gif'), pressing Save changes must not silently save and close the form. save() in app/frontend/src/screens/user-profile.tsx ignores the pending rejection, saves, and calls onDone, which unmounts the picker and its refusal alert. The verify test then reads an empty refusal. While a refusal is showing, keep the form open with the refusal visible and focused, and do not save. Add a unit test covering it.
- R-8.21: when a picture is chosen, check the file's first bytes in the browser (JPEG FF D8 FF, or the 8-byte PNG signature) and show a refusal in the picker's alert straight away, as is already done for the name ending and the size. checkChosenPicture in app/frontend/src/app/image-picker.tsx checks only the name and size, so a '.png' whose content is text is accepted at choose time, and the verify test reads no refusal. Keep the service's own check. Add a unit test covering it.
- When the summary describes the earlier egress fix, do not quote the wording that was replaced. The proposal page is itself checked by egress rule E-2 and is flagged for quoting it.
- addressed-to plan: slice 3 claims R-8.13, R-8.21, R-8.28 and R-8.30 whole, but each has an organization-logo half that the acceptance suite exercises on /organizations/:orgId/edit (and the organization list for R-8.28), which slice 3 does not build. The verify run against c13c0cc reports those halves unbound ('/organizations/:orgId/edit did not open as a screen') or failing, while the profile-picture halves of R-8.13 and R-8.28 pass. Move these criteria, or their logo halves, to the slice that builds the organization edit screen, or make that slice a prerequisite of slice 3.
