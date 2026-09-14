| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-14T02:08:15.838Z |
| holder | agent:reviewer |

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

## Ruling

**Verdict:** return
**By:** agent:reviewer

Question: do the revised notifications tests follow from their criteria and from nothing else? Ruling: return. Both blocking conditions from the previous ruling are met. R-6.28 no longer asserts notifyVendorsSuccess(). R-6.6 drops the vendorOne address check and asserts unsubscribeConfirmation() is present and resolvesToSignedInPerson(), which is what 'the reader's own notification settings' states. Both recommendations were taken: R-6.19 searches for the spec's phrase 'evaluation panel', and R-6.7 uses confirmationNamesSignedInAddress(), matching its then-clause 'the confirmation naming their own address'. Between the notifications-2 proposal commit (efd468b) and this one, only R-6.6, R-6.7, R-6.19 and R-6.28 changed in the notifications slice. The R-6 not-testable entries were relocated in the file, not added or removed. The runner typecheck reports no diagnostics under acceptance/notifications/; its 13 diagnostics are in acceptance/files/, outside this proposal. Tier is STANDARD, no protected path is touched and no residual risk is marked unaccepted, so nothing requires escalation. One test still asserts what its criterion does not say, and the brief requires a return for that. R-6.23 keeps expect(notifyVendorsSuccess()).toBeTruthy(). R-6.23's then-clause is that every vendor's acceptance is withdrawn and each active vendor receives a message. It says nothing about the administrator being told the broadcast succeeded. Success reporting is R-6.24's claim, and R-6.24 is recorded as not testable. This is the same defect returned in R-6.28 last round, and the previous ruling passed R-6.23 in error. What would change the ruling: remove that single assertion from R-6.23. Its notifyVendorsConfirmation() check can stay, since the criterion's when-clause has the administrator confirm.

**Conditions:**
- R-6.23: remove `expect(await surface.notificationTermsBroadcast.notifyVendorsSuccess()).toBeTruthy()`; the criterion states that acceptance is withdrawn and active vendors are messaged, not that the administrator is told it succeeded (that is R-6.24's claim).
- For the suite owner, outside this slice, carried forward: R-6.10, R-6.14, R-6.22 and R-6.26 test superseded criteria, and R-6.14 asserts the opposite of R-6.19 so the two cannot pass together; decide whether they stay as oracle-only tests or are removed.
- For the spec owner, carried forward: R-6.6 v2 (Unsubscribe on every message) conflicts with R-6.16 (messages the preference does not govern must not offer Unsubscribe); one of them needs a new version.

### Runner-owned typecheck evidence

Proposal revision: `94f0f0b9b6b59a918bff38b908d3b197f23a003e`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/notifications/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    acceptance/files/: 13 diagnostics
