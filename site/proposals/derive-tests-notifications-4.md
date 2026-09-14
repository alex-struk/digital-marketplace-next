| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-14T02:29:44.739Z |
| holder | agent:reviewer |

# Do the revised notifications tests now follow from their criteria and from nothing else?

**Recommendation.** I removed the one assertion the reviewer named.

I removed the one assertion the reviewer named. Nothing else in the notifications slice or in `tests/acceptance/not-testable.yaml` was touched.

**Condition 1 (R-6.23).** I deleted the line `expect(await surface.notificationTermsBroadcast.notifyVendorsSuccess()).toBeTruthy();` from `tests/acceptance/notifications/R-6.23.spec.ts`. The reviewer was right: the criterion says every vendor's acceptance is withdrawn and each active vendor gets a message. Telling the administrator it worked is R-6.24's claim, and R-6.24 is recorded as not testable.

The rest of the test is unchanged:
- **Kept checks:** the control is present, and the confirmation step appears (the criterion has the administrator confirm).
- **Mail check:** new messages still reach both seeded vendors.
- **Vendor check:** each vendor's own legal settings still show the terms-updated warning.

I left the header alone, including its derived date (2026-09-14, the day after today's date). Nothing was re-derived, and the file still claims the same criterion version and spec commit.

After the edit I searched the slice for `notifyVendorsSuccess`. One use is left, in R-6.26. I did not touch it: R-6.26 is one of the tests condition 2 flags for testing a superseded criterion, and that call belongs to the suite owner, not to this change. If R-6.26 stays as an oracle-only test, whoever decides should know it still checks the success message.

**Condition 2 (R-6.10, R-6.14, R-6.22, R-6.26 test superseded criteria; R-6.14 and R-6.19 contradict each other).** No action. This is for the suite owner and outside this slice; each file stays byte-for-byte as I found it. R-6.14 and R-6.19 still cannot both pass, and that stands until the suite owner keeps or removes those tests.

**Condition 3 (R-6.6 v2 conflicts with R-6.16 over whether Unsubscribe appears on every message).** No action. It needs a new version of one criterion from the spec owner, and this stage can't edit spec files. The R-6.6 test still follows its v2 wording as approved last round.

No criterion changed status, so `not-testable.yaml` is unchanged. This round needed no surface actions or observations that the contract doesn't already provide. I did not re-run the typecheck. Removing one line that awaits a call and asserts on it should add no errors, but that is not confirmed.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Question: do the revised notifications tests follow from their criteria and from nothing else? Ruling: approve. The one blocking condition from the previous ruling is met. The only change under tests/ or spec/ between the notifications-3 proposal commit (94f0f0b) and this one removes `expect(await surface.notificationTermsBroadcast.notifyVendorsSuccess()).toBeTruthy()` from R-6.23. R-6.23 now asserts only what its criterion states: the notify control is present, the confirmation step appears because the when-clause has the administrator confirm, new messages reach two active vendors, and each vendor's own legal settings show the terms-updated warning, which is the withdrawn acceptance. The rest of the slice was checked in the previous two rulings. R-6.6, R-6.7, R-6.13, R-6.17, R-6.19, R-6.21, R-6.27 and R-6.28 assert only their criteria, and every R-6 not-testable reason names a real missing mail accessor, target variant, persona or seed state. The runner's typecheck on this revision reports no diagnostics under acceptance/notifications/; its 13 diagnostics are in acceptance/files/, outside this proposal. Checks pass, with warnings only for tests of superseded criteria. The tier is STANDARD, no protected path is touched and no residual risk is marked unaccepted. G3's weekly human sample (5 per week) was not counted here and is left to the runner. What would change the ruling: evidence that a notifications file other than R-6.23 changed since the last ruling, or runner diagnostics appearing under acceptance/notifications/.

**Conditions:**
- For the suite owner, outside this slice, carried forward: R-6.10, R-6.14, R-6.22 and R-6.26 test superseded criteria, and R-6.14 contradicts R-6.19 so the two cannot pass together. R-6.26 also still asserts notifyVendorsSuccess(), which its replacement R-6.28 does not state. Decide whether they stay as oracle-only tests or are removed; removal is recommended.
- For the spec owner, carried forward: R-6.6 v2 (Unsubscribe on every message) conflicts with R-6.16 (messages the preference does not govern must not offer Unsubscribe); one of them needs a new version.

### Runner-owned typecheck evidence

Proposal revision: `5a626e87450f3bf80f9c4c97b93ead9e3b2ae3af`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/notifications/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    acceptance/files/: 13 diagnostics
