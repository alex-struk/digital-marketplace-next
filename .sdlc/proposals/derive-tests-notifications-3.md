---
gate: G3
question: "Do the revised notifications tests now follow from their criteria and from nothing else?"
recommendation: "I changed four test files in the notifications slice, one for each condition that belongs to this slice."
opened: 2026-09-14T02:08:15.838Z
---

# Do the revised notifications tests now follow from their criteria and from nothing else?

**Recommendation.** I changed four test files in the notifications slice, one for each condition that belongs to this slice.

I changed four test files in the notifications slice, one for each condition that belongs to this slice. Everything else is exactly as I found it: the other nine files under `tests/acceptance/notifications/`, `tests/acceptance/not-testable.yaml` and every spec file. No criterion moved between having a test and having a not-testable entry.

**I could not run the typecheck.** Each attempt to run `tsc` was refused pending an approval that never came, so the runner's typecheck still has to be re-run on this slice before the proposal can be confirmed clean. Instead I checked by hand that every method I call exists in `tests/generated/surface.d.ts`: `resolvesToSignedInPerson()`, `confirmationNamesSignedInAddress()` and `unsubscribeConfirmation()` all do. In R-6.6 and R-6.7 I also removed the `seed` import once nothing in the file used it any more.

Each changed file's header date now reads 2026-09-13, today's date here. That is one day earlier than the 2026-09-14 the previous turn wrote. I kept today's date rather than copy a date I can't account for, but whoever reads the headers should know the order looks reversed.

**Condition 1, R-6.28:** I removed the `notifyVendorsSuccess()` assertion. I also cut "and the administrator told it succeeded" from the comment, so the comment no longer claims what the test no longer checks. The test now only requires that every addressable vendor gets a new message after the broadcast is confirmed.

**Condition 2, R-6.6:** I removed the check that `unsubscribeConfirmation()` contains vendorOne's email address. In its place the test checks two things:
- `unsubscribeConfirmation()` has content, so the confirmation-present check stays.
- `resolvesToSignedInPerson()` holds, which is what "the reader's own notification settings" states.

**Condition 3, R-6.19 (recommended):** the search term is now "evaluation panel" instead of the guessed "panel". That is the phrase R-6.14 and R-6.15 use for these messages. The comment now says the search uses the spec's own wording. The "consensus" check is unchanged.

**Condition 4, R-6.7 (recommended):** I replaced the two substring checks on the free-text `unsubscribeConfirmation()` with one check on `confirmationNamesSignedInAddress()`. The old checks were "contains the reader's address" and "does not contain the addressee's address". The second no longer has a direct equivalent. It is still covered in substance: the test's last step confirms the addressee's own notification setting is unchanged. The two local variables that only those checks used are gone. The second test (the offer can't be used without signing in) is untouched.

**Condition 5, for the suite owner:** I didn't act on it, because it is outside this slice. R-6.10, R-6.14, R-6.22 and R-6.26 still test superseded criteria. R-6.14 still asserts that "evaluation panel" and "consensus" are absent from the reference page, while R-6.19 now asserts both are present. The two can't pass together, and the suite owner has to decide whether to keep them as oracle-only tests or remove them.

**Condition 6, for the spec owner:** I didn't act on it either. The conflict between R-6.6 v2 (an Unsubscribe offer on every message) and R-6.16 (no Unsubscribe offer on messages the preference does not govern) needs a new criterion version, and spec files are not mine to edit. Until that happens, the R-6.6 test checks only the general label and where the offer leads.

No surface actions or observations were missing. Everything the conditions asked for already exists in the contract.
