---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "None of the listed criteria is fixed yet."
opened: 2026-09-30T13:22:22.057Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** None of the listed criteria is fixed yet.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've changed the "new" adapter so it can handle the signed-in screens, but I couldn't sign in myself, so none of those screens has been seen. None of the listed criteria is fixed yet. Nothing was typechecked or run: there's no `node_modules` in the workspace, and running Python, `sed -i` or checking an environment variable all needed approval nobody was here to give. The first run that signs in will be the first real test of the new code.

**Why I couldn't sign in.** The password in `SDLC_SANDBOX_PASSWORD` isn't set in the browser tool's process, and my shell wouldn't let me check it without approval. The identity provider's page (localhost:8080) offers only Username, Password and "Sign In", with no self-registration. The existing `signIn()` already fills exactly that form correctly, so it's unchanged. Every criterion on your list is blocked by this one thing, as it was last time.

**What changed in `tests/adapters/new/index.ts`:**
- **A real bug in reading refusals.** The helper that detects a refused page only recognised a heading reading exactly "Not found". This target now shows "Page not found" with a "Back to home" link. So every reading about a refusal (`sign_in_required`, the evaluation screens' "refused when not permitted", and others) returned empty on a page that had in fact refused. That could have let refusal tests pass wrongly. It now recognises both wordings; I confirmed on `/users/me`, `/users/<seeded id>` and `/users/not-a-user`.
- **`open()` on signed-in screens.** It used to throw `unbound:` every time. It now goes to the page and throws only if the page really refuses: "Page not found", a redirect to `/sign-in`, or a hand-off to the identity provider. A run that signs in and reaches the screen is no longer blocked at `open()`.
- **Wrong reasons fixed.** The old reasons said the signed-in routes all redirect to `/sign-in` when signed out. Only `/dashboard` and `/sign-up/complete` do. `/users/me`, `/users/:userId`, `/users/me?tab=notifications`, `/organizations/:orgId/edit` and `/opportunities/code-with-us/create` show "Page not found".
- **Controls looked up by name when the test runs.** The seven pages behind your list now find their controls by role and accessible name when a test runs, instead of always throwing: the dashboard, the Code With Us create form, organization edit, sign-up complete, a user's profile, your own profile, and your own notification settings.
  - Actions enter every input value in the field its label names before pressing anything. They throw `unbound:` naming any value no field takes. A disabled button fails straight away with its name.
  - Every member first checks the screen actually opened, and throws `unbound:` (listing what the page does offer) if it didn't or the control isn't there. A reading returns empty only when the screen opened and shows nothing.
  - The labels are informed guesses, partly from what the old target's adapter found on its version of these screens ("Edit Profile", "Save Changes", "Complete Profile", "Job Title" and so on). Expect some to miss and report `unbound:` on the first signed-in run.
- **Still unbound in code:** `organization-edit.invalid_membership_type_error`, since the team screen offers only one kind of membership to choose, and every other signed-in page, which still throws `unbound:` per member with the corrected reasons.

**`tests/adapters/new/bindings.yaml`:** all the seven pages' members stay declared `unbound:`, because none was checked signed in. Each reason now says what I tried, what the route shows signed out today, and what the adapter will look for at run time. I moved only two entries to `bound`, both checked on the live target signed out: `user-profile.not_found_page` and `user-profile-self.sign_in_required`.

**By criterion:**
- R-6.3, R-6.4, R-6.5, R-6.28, R-6.20, R-4.1, R-4.2, R-4.6, R-4.22, R-4.27 and R-4.28 are no longer blocked by the adapter itself. They depend on a run that can sign in and on the guessed labels matching.
- R-6.2 (Code With Us create) is in the same position.
- R-4.3, R-4.23 and R-4.24 also need the sign-up persona's account to still have an unfinished profile. Otherwise `/sign-up/complete` sends it on, and the adapter reports that as `unbound:`.

Every route in `surface.yaml` that I opened loaded on the target, either as its page or as a refusal. I didn't open all of them, but none I tried failed to resolve. I didn't touch anything outside `tests/adapters/new/`, and no password or environment value is written in the adapter, the bindings file or here.
