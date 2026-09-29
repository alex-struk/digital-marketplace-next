---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I fixed the R-4.24 finding: the profile-completion page (`user-sign-up-complete`) is now bound in full, all eleven of its members."
opened: 2026-09-29T09:06:37.793Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I fixed the R-4.24 finding: the profile-completion page (`user-sign-up-complete`) is now bound in full, all eleven of its members.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed the R-4.24 finding: the profile-completion page (`user-sign-up-complete`) is now bound in full, all eleven of its members. I could not type-check the change, because running `tsc` needed an approval this session could not give. Neither did I run "Complete Profile" end to end.

**What was wrong.** The earlier run said `/sign-up/complete` never shows its form and that `/auth/createsessionvendor/17` fails with an auth-failure notice. The reviewer was right that this came from a database missing seed file `015-profile-completion.sql`. On the target as it runs now, `/auth/createsessionvendor/17` signs in the seeded vendorCompletingProfile persona and lands straight on `/sign-up/complete`. The adapter's existing `signIn` already goes through that route for any persona, so it needed no change.

**What the page shows.** A form headed "You're almost done!" with:
- a "Choose Image" picture control, which I confirmed opens a file chooser;
- a disabled "GitHub" box holding the sign-in username, test-vendor-17;
- "Name*" and "Email Address*", filled in from the seed;
- a terms box ("I acknowledge that I have read and agree to the Terms and Conditions and Privacy Policy");
- a "Notify me about new opportunities." box;
- "Complete Profile", which stays disabled until the terms box is ticked. I watched it switch on when I ticked the box and off again when I unticked it.

Clearing the name shows "Name must be between 1 and 100 characters long." and a bad address shows "Please enter a valid email."

**What I bound.**
- **`change_avatar`** uses the same picture chooser as the profile page.
- **`accept_app_terms`** ticks the terms box, or sets whatever state the test gives.
- **`toggle_new_opportunity_notifications`** flips the notices box, or sets a given state.
- **`complete_profile`** enters every value the test gave before pressing: fields by label, the picture, and the terms and notices boxes if they are named. If a key has no field it throws `unbound:` naming the key. If the button is disabled it reports that at once instead of waiting. After pressing, it expects the page to leave `/sign-up/complete`, and if it doesn't it reports what the page says.
- **The username, name and email readers** read those boxes.
- **`job_title_field`** returns empty: the vendor's form really has no Job Title field, and I assume only public sector staff get one.
- **`field_error`** returns the messages shown under the fields.
- **`terms_checkbox` and `complete_disabled_until_terms_accepted`** keep their earlier behaviour: an account that has already accepted the terms gets sent on, and for it they return empty.
- **Every other reader and action** throws `unbound:` when the visitor is sent on, naming where they landed. In that case the form was never reached.

In `bindings.yaml`, all eleven members of `user-sign-up-complete` are now `bound`. Nothing else in the adapter or the bindings changed.

**What I did not do.** I did not press "Complete Profile" on the live target. Doing so would record vendor 17 as having accepted the terms, and later stages would then find no profile form. So the redirect after completing, and the recording of the notices opt-in, are untested here and should be exercised on a freshly seeded target. I left the persona's form unchanged and signed the browser out. Every page route resolved; I changed nothing outside `tests/adapters/old/`.
