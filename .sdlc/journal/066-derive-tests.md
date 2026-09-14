---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-14T02:29:44.727Z"
cost: 0.25702849999999994
turns: 5
session: "74fe2693-7374-4134-91bf-7bb4cd79b135"
---

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