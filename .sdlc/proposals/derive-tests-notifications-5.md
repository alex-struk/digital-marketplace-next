---
gate: G3
question: "Do the revised notifications tests now follow from their criteria and from nothing else?"
recommendation: "I rewrote R-6.23 and R-6.28 to meet the five conditions."
opened: 2026-09-14T23:25:42.648Z
---

# Do the revised notifications tests now follow from their criteria and from nothing else?

**Recommendation.** I rewrote R-6.23 and R-6.28 to meet the five conditions.

I rewrote R-6.23 and R-6.28 to meet the five conditions. Only those two files changed. I could not type-check them: this workspace has no `node_modules` and no TypeScript compiler, so the runner's type check still has to confirm them. A search of both files found no locator, selector, route or URL string, and no remaining `notifyVendorsSuccess` call. Neither test has been run.

**Condition 1: removed the success check.** Neither file calls `notifyVendorsSuccess()` any more. Without that check, R-6.23 can't be sure the announcement has finished before it reads the result. So it now reopens each vendor's legal settings and polls until the warning appears, within a fixed time limit. That waits on the thing the criterion describes, not on a message it never mentions.

**Condition 2: active status is read through the surface.** Both tests now take every vendor account from the seed only as a list of candidates, and make no assumption about which are active. The administrator first opens their own record on `userProfile` and reads its `statusBadge()`. They are the account making the announcement, so that badge is what "active" looks like. I compared against this badge on the same page, not against a guessed wording like "Active", which the contract never fixes. The administrator then opens each vendor on `userProfile`:
- a vendor whose badge matches is treated as active, and only active vendors with an email address are expected to get a message;
- in R-6.23, a vendor whose badge differs is treated as deactivated.

R-6.23 used to sign in as two vendors to read the warning. vendorOne is one of them and may be deactivated during a run, so the administrator now reads every vendor's legal settings instead.

**Condition 3: R-6.28 reports every vendor not reached at once.** It fails unless vendorWithoutEmail is among the active vendors, since the broadcast has to pass that recipient. A single `expect.poll` then checks every active vendor with an address on each attempt and returns the ones with no new message. If time runs out, the failure lists all of them together. The comment explaining why two parts of the criterion are not checked is unchanged.

**Condition 4: R-6.23 reads prior acceptance before announcing.** Before the announcement, the test reads each vendor's `acceptedOnNotice()` and `termsUpdatedWarning()` on `userProfileLegal`. A vendor with an acceptance and no warning holds a standing acceptance. The test requires at least one active and at least one deactivated vendor in that state; that is the mix the criterion starts from. Afterwards it expects the warning for exactly those vendors, so a warning left by an earlier announcement can't pass the test. vendorWithTermsReset is already warned in the seed, so it is left out of that check, and the file comment says why. Because the prior reading was possible, the file needed no note about something missing from the surface.

**Condition 5: the redo entries.** `tests/acceptance/redo.yaml` already holds both entries, and I left it as it was. `tests/results/old/applied.yaml` does not exist in this workspace, so I couldn't check or keep entries there. If the earlier deletion reached that file somewhere else, it has to be restored outside this stage.

**Other notes:**
- Both headers keep their spec hash and the date 2026-09-14, which is today and is when the content changed.
- R-6.23 now opens about three dozen pages before the mail checks, so I marked it as slow to give it more time.
- No other file in the notifications folder and nothing in `not-testable.yaml` was touched, and I added no new not-testable entries.
- The only surface gaps in these criteria are the two R-6.28 parts already noted. Nothing lets the catcher see a message with no recipient, and nothing makes one delivery fail.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

The question is whether the R-6.23 and R-6.28 tests now follow from their criteria and nothing else, and whether they meet the five conditions derive-tests-notifications-stale-2 returned. Ruling: approve. All five are met. (1) Neither file calls notifyVendorsSuccess(); the success message is R-6.24's subject. (2) Both tests work out which vendors are active before the broadcast. They compare each vendor's userProfile.statusBadge() with the signed-in administrator's own badge; administratorOne is the administrator persona's account and is seeded ACTIVE. Neither test assumes vendorOne is active. (3) R-6.28 runs a single expect.poll that checks every active vendor with an address on each attempt and ends by comparing the list of unreached vendors to empty, so a failure names them all together. It also requires vendorWithoutEmail to be among the active vendors. The 30-second poll fits inside the 120-second test timeout in playwright.config.ts, so the full list is reported. (4) R-6.23 reads acceptedOnNotice() and termsUpdatedWarning() on userProfileLegal before announcing, and afterwards expects the warning only for vendors who had accepted and were not yet warned. It requires at least one active and one deactivated vendor in that state, which is the criterion's given ('a mix of active and deactivated vendors who had all accepted the previous terms'); the seed supports it, since vendorDeactivated is INACTIVE_ADMIN with acceptedTermsAt set. vendorWithTermsReset, already warned in the seed, is left out for a stated reason. (5) The R-6.23 and R-6.28 entries remain in tests/acceptance/redo.yaml and tests/results/old/applied.yaml; this diff does not touch either file. Also sound: matching /terms/i against the message's subject or snippet follows from 'a message naming the change'; R-6.28's two unasserted parts are left out for real reasons (a message with no recipient never reaches the catcher, and nothing in the seed or surface makes one delivery fail); every name used exists in spec/contract/surface.yaml; no selector, route or status code appears; and the runner's type check passed. Two notes that do not affect the ruling. First, the proposal says not-testable.yaml was untouched, but its own commit moves the eight R-8.x entries above R-6.1 without changing their text. Second, R-6.28 catches a broadcast that stops at the vendor without an address only if the service reaches that vendor before an addressable one; the surface cannot set that order, so this is a limit of coverage, not an assertion the criterion does not make. Tier is STANDARD with no unaccepted residual risk, so no escalation. What would change the ruling: a failing type check on these files, or evidence that the not-testable.yaml reorder changed an entry's text.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `160eb645d3ea7394f868cabba52d32c075e6171d`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/notifications/`, which this proposal answers for.

    No diagnostics.
