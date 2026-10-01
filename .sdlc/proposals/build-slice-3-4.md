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
