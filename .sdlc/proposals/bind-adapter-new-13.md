---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I re-walked all nine flagged criteria on the running target at http://localhost:4300, signed in through the sandbox identity provider as the administrator (test-admin), a vendor (test-vendor-1) and th…"
opened: 2026-10-01T01:23:30.477Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I re-walked all nine flagged criteria on the running target at http://localhost:4300, signed in through the sandbox identity provider as the administrator (test-admin), a vendor (test-vendor-1) and th…

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I re-walked all nine flagged criteria on the running target at http://localhost:4300, signed in through the sandbox identity provider as the administrator (test-admin), a vendor (test-vendor-1) and the organization owner (test-vendor-2). Five members changed: three are now bound, and two now return empty when the app refuses the person. The organization, content-edit, attachment and email-reference screens still don't resolve, so those members stay unbound. The workspace has no installed dependencies, so I couldn't type-check or run the adapter. I tested each new reading's page logic live in the browser instead.

**Now bound:**
- **Unsubscribe landing (R-6.7).** The earlier walk was done only as the administrator, who doesn't receive new-opportunity emails, so no dialog appeared. As test-vendor-1, who does, `/users/me?tab=notifications&unsubscribe` opens a dialog titled "Stop emails about new opportunities?". It reads "You are signed in as <name>. <address> will no longer be emailed…" and has "Keep receiving them" and "Unsubscribe" buttons. I checked that "Keep receiving them" closes it and leaves the setting on. I didn't press "Unsubscribe", so the seeded account isn't changed.
  - `confirm_unsubscribe` and `cancel_unsubscribe` press those two buttons. To a person with no dialog, they fail and say why.
  - `unsubscribe_confirmation` and `confirmation_names_signed_in_address` read the dialog, and return empty when none opens.
  - `resolves_to_signed_in_person` reads the address in "Notifications are sent to …".
- **Profile picture picker (R-8.13, R-8.21, R-8.28, R-8.30).** "Edit profile" shows a "Profile picture (optional)" group with its JPEG/PNG rule and a "Choose a profile picture" button. Pressing the button by click, Enter or Space opens no file chooser. The hidden file input next to it is never even clicked. The control the contract names is on the page and does nothing, which is the target's fault, not a missing binding. So `file-image-picker.choose_image` and every `change_avatar` (on `user-profile`, `user-profile-self` and `user-sign-up-complete`) are now bound. They press that button and fail with a plain error naming it, not an `unbound:` one.

**Now returns empty when refused:**
- **`user-profile.email_field` (R-4.25).** `/users/:userId` does open: the administrator sees another account's profile, email included. A vendor opening someone else's profile gets "Page not found", which is the app refusing that person. The profile's readings on `user-profile` now return empty in that case instead of throwing unbound, and `not_found_page` still reads the refusal.

**Still unbound, re-checked:**
- **Organization screens (R-6.16, and the second half of R-8.13, R-8.21, R-8.28, R-8.30).** `/organizations`, `/organizations/create`, `/organizations/<seeded id>` and its `/edit` all answer "Page not found" to the administrator and both vendors, including test-vendor-2, which owns the seeded organization. That owner's own Organizations section says organizations "will be listed here once organizations can be registered", so this part hasn't been built.
- **Content and opportunity screens (R-4.33, R-8.17).** `/content`, `/content/terms-and-conditions/edit`, `/opportunities` and `/opportunities/create` answer "Page not found" to the administrator.
- **Email reference (R-6.6).** `/admin/email-notification-reference` is answered by the service itself, to the administrator: 404 "Cannot GET".

These pages' routes did not resolve on the target at all: everything under `/organizations`, `/opportunities` and `/proposals`, the content-management screens under `/content`, the evaluation screens, and `/admin/email-notification-reference`. A signed-in person is served only `/dashboard` (a greeting), the account screens under `/users`, and `/sign-up/complete` for a vendor who hasn't finished their profile.

I changed only `tests/adapters/new/index.ts` and `tests/adapters/new/bindings.yaml`. The bindings file still names every member exactly once, spelled as `surface.yaml` spells it. No password or environment value is written anywhere.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the bind-adapter-new-13 adapter bind every surface action and observation on the new target, and nothing else? Ruling: approve. The diff touches only tests/adapters/new/index.ts and bindings.yaml. Nothing under tests/acceptance or any protected path changed, and the runner's typecheck on this revision passed with no diagnostics under adapters/new/. The new bindings are navigation and locators only. (1) file-image-picker.choose_image and the change_avatar members on user-profile, user-profile-self and user-sign-up-complete now press the 'Choose a profile picture' button the contract names. When no file chooser opens they fail with a plain error naming that button, and they do not bypass it by setting the hidden file field directly, which no person could do. That turns a page fault that was being reported as an unbound member into an honest failure against the application, and the adapter decides nothing about pass or fail. (2) The user-profile readings on /users/:userId return empty when the service shows 'Page not found', which reads what the refused person is shown (R-4.25), while not_found_page still reads the refusal. (3) notification-unsubscribe-landing locates the 'Stop emails about new opportunities?' dialog and its 'Keep receiving them' and 'Unsubscribe' buttons, reads the dialog text and the address in it, and returns empty or fails with a stated reason when no dialog opens. Whether that dialog should appear for a given person is left to the test. The members still unbound (organization screens for R-6.16 and the logo half of R-8.13, R-8.21, R-8.28 and R-8.30; the content and opportunity screens for R-4.33 and R-8.17; the email reference for R-6.6) give real reasons: the routes answer 'Page not found' or 404 to every role walked, including the seeded organization's owner. The egress check failure is on files outside this diff. The tier is STANDARD and no residual risk is marked unaccepted. What would change the ruling: evidence that a file chooser does open by some means a person has, which would make the thrown error a wrong binding, or a reading found to compare values rather than report them.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `6bca899904c45422f098e59291f5d7b6f1ee5284`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
