| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-30T19:50:28.798Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I changed only the profile-completion page (`user-sign-up-complete`) in `tests/adapters/new/index.ts` and `tests/adapters/new/bindings.yaml`, to meet the reviewer's condition from the previous binding…

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I changed only the profile-completion page (`user-sign-up-complete`) in `tests/adapters/new/index.ts` and `tests/adapters/new/bindings.yaml`, to meet the reviewer's condition from the previous binding run. I couldn't type-check the adapter: the type-checker command needed an approval nobody can give in this session. I checked the new logic by running the same steps in the browser against the live target, but a compile error, though unlikely, has not been ruled out.

**The fix the reviewer asked for.** The page `/sign-up/complete` sends most people somewhere else. I confirmed both cases on the running target:
- A signed-out visitor goes to `/sign-in?redirectOnSuccess=%2Fsign-up%2Fcomplete`.
- The administrator, signed in, goes to `/dashboard`.

When that happens, the seven readings of the form now return empty instead of throwing unbound. Those readings are `terms_checkbox`, `name_field`, `email_field`, `job_title_field`, `idp_username_readonly`, `complete_disabled_until_terms_accepted` and `field_error`. The four actions still report unbound in that situation, and the message names the address the browser was sent to. If the browser is somewhere else entirely, meaning the page was never opened, the readings still throw unbound. Only a redirect to `/dashboard` or `/sign-in` counts as the page's answer.

**New finding: signing in works now.** Every earlier binding of this target said the sandbox password couldn't be used, so no signed-in page had ever been looked at. In this session, the identity provider's Username and Password form accepted the substituted password for both `test-admin` and `test-vendor-17`. The adapter's existing `signIn` follows the same path I took by hand.

**The form itself, now seen.** Signed in as the vendor who still has a profile to complete (`test-vendor-17`), I opened "Complete Your Profile". It shows:
- a read-only "Sign-in username"
- "Name" and "Email address"
- "Email me when new opportunities are posted"
- a box agreeing to the terms and privacy policy
- "Complete profile", disabled until that box is ticked

The adapter's existing label patterns match every one of these. There is no job title field, so `job_title_field` correctly reads empty. I didn't press "Complete profile", so that vendor's seeded state is unchanged. On the strength of what I saw, the bindings file now lists as bound: `accept_app_terms`, `toggle_new_opportunity_notifications`, `complete_profile`, and all seven readings.

**`change_avatar` stays unbound, for a new reason.** The "Choose a profile picture" button is the contract's `change-avatar` control, but pressing it opened no file chooser. The form's only file input is hidden and has no label, so nothing a person can see lets a file be offered. The adapter now reports this as unbound with that explanation, instead of timing out after 10 seconds.

**Not done, outside this stage's scope:** the rest of the adapter still says in its comments and bindings that no signed-in page was ever seen. That is out of date now that sign-in works. A full rebind of the signed-in pages would probably move many members from unbound to bound; I only rebound this one page.

No page route failed to load. I changed nothing outside `tests/adapters/new/`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the new adapter bind every surface action and observation on the profile-completion page, and nothing else? It does. The change meets bind-adapter-new-6#1 as worded: when /sign-up/complete sends the browser to /dashboard or /sign-in, the seven readings return empty; the four actions still report unbound, naming where the browser was sent; and a browser that is anywhere else still reports unbound. Every binding is navigation and locators only. Returning empty is a reading, not a verdict: every test in tests/acceptance/users/R-4.23.spec.ts calls open() before reading, then asserts the terms box is absent and asserts the destination screen (dashboard table or empty message, or the sign-in vendor card) is present. So an adapter that cannot tell a redirect from a browser already sitting on /dashboard cannot pass a test vacuously. Moving the form's members to bound rests on the form being seen signed in as the vendor still to agree, and the labels observed match the adapter's patterns. change_avatar's unbound reason names a real gap in the surface: the picture control opens no file chooser and the only file input is hidden and unlabelled. Only tests/adapters/new/ changed; nothing under tests/acceptance did. The runner's typecheck on this revision passed with no diagnostics. Tier is STANDARD and no residual risk is marked unaccepted, so there is no escalation. What would change this ruling: evidence that 'Complete profile' is not disabled until the terms box is ticked, or that a label pattern misses a field on the form, which would make a member marked bound wrong. build-slice-2-5#1 and build-slice-2-8#2 are owed by build and are not settled here.

**Conditions:**
- condition-met bind-adapter-new-6#1: in tests/adapters/new/index.ts, signUpFormShown() returns false when /sign-up/complete has sent the browser to /dashboard or /sign-in; the seven readings (idpUsernameReadonly, nameField, emailField, jobTitleField, termsCheckbox, completeDisabledUntilTermsAccepted, fieldError) then return empty, while the actions still go through onSignUpForm(), which reports unbound naming page.url(). The change is recorded against these members, with a comment, under user-sign-up-complete in tests/adapters/new/bindings.yaml.

### Runner-owned typecheck evidence

Proposal revision: `1b061da37d626547deaa47d7c2f92f74b62f2cc6`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
