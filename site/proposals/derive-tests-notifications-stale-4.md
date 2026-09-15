| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-15T05:28:41.753Z |
| holder | agent:reviewer |

# Do these tests follow from the notifications criteria and from nothing else?

**Recommendation.** I rewrote the test for R-6.23 (v1), the only criterion in this run, so it now has one test file and no entry in `not-testable.yaml`.

I rewrote the test for R-6.23 (v1), the only criterion in this run, so it now has one test file and no entry in `not-testable.yaml`. I could not run it or typecheck it: both commands were refused permission here, so it has only been checked by reading.

**Why it was rewritten.** The last approved test was flagged for redo. It tried to read each vendor's acceptance of the terms, and later its withdrawal, from the administrator's view of that vendor. That view never shows acceptance, so the test failed before any announcement was made. The new file reads both on `userProfileSelfLegal`, signed in as each vendor through that vendor's persona.

**What the test does.** It is one test, because the criterion states a single given/when/then.
- **Given.** Signed in as the administrator, it sorts every vendor in the seed into active and deactivated. It uses each vendor's `userProfile.statusBadge()` and treats the administrator's own badge as what "active" looks like, rather than trusting the seed, since mail and earlier state may carry over. It then records which vendors hold a standing acceptance: signed in as the vendor, an accepted-on notice shows and there is no warning about changed terms. It requires at least one such vendor in each group.
- **The deactivated vendor.** Nothing guarantees a deactivated account can reach its own settings, so the administrator reactivates it just long enough to read its acceptance, then deactivates it again before the announcement. After the announcement it is reactivated once more to see what it finds on returning, which is how the criterion's note says such a vendor learns of the change.
- **When.** On `notificationTermsBroadcast`, the administrator uses the notify control, sees the confirmation, and confirms.
- **Then (mail).** Every active vendor with an email address must receive a new message, and its subject or opening text must mention the terms. It lists every vendor not reached instead of stopping at the first.
- **Then (withdrawal).** Every vendor that had a standing acceptance, deactivated ones included, must now see the changed-terms warning on their own legal page. Again it lists every vendor that still shows acceptance.

**Left out, and why.**
- `seed.users.vendorWithTermsReset` starts with its acceptance already withdrawn. It is still checked for the message but not for withdrawal, since nothing could tie its warning to this announcement.
- `seed.users.proponentThree` has no persona, so its own legal page cannot be reached. Only its message is checked.
- The vendor with no email address cannot be looked up in the mail catcher, so it gets only the withdrawal check.

**Surface gaps.** I needed two things the contract does not offer:
- **The whole message body.** The criterion says the message offers a link to read and accept the new terms. `mail` returns only the subject and a short snippet, so that link is not asserted. A `mail` call returning the full body, or its links, would close this.
- **An administrator's view of a vendor's acceptance.** `userProfileLegal` shows no acceptance for somebody else, so reading it takes signing in as each vendor, and a deactivated vendor has to be reactivated first. An observation of another vendor's acceptance, or of withdrawal on a vendor's profile, would remove that detour and cover vendors with no persona.

**Assumptions not verified.**
- An observation that has nothing to show returns an empty string rather than throwing; the standing-acceptance and warning checks depend on this.
- Reactivating and deactivating an account does not itself change its acceptance of the terms.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

The question is whether the rewritten R-6.23 test follows from its criterion and nothing else. Approved. It does what the redo asked: it reads each vendor's acceptance, and the later request to accept changed terms, on that vendor's own legal settings while signed in as them. The given is checked: both active and deactivated vendors include at least one who has accepted and has no changed-terms warning. The when is the administrator using the notify control on the terms broadcast page and confirming. The then is the criterion's two outcomes. Every active vendor with an address gets a new message whose subject or opening text names the terms. Every vendor who had accepted, deactivated ones included, now sees the changed-terms warning. Failures are listed rather than stopping at the first. The step that switches a deactivated vendor on, off before the announcement and on again afterwards comes from the criterion's note that such a vendor learns of the change only on returning. No selector, route, table, column or status code appears. Every member used exists in the contract and the runner's typecheck is clean. The exclusions are real: vendorWithTermsReset starts already warned, proponentThree has no persona, and the vendor with no address cannot be looked up in the catcher. The link to accept the new terms is unchecked because the mail helper returns no body. The removed redo.yaml and applied.yaml entries are the redo request and old rulings this rewrite answers, matching the earlier approved stale ruling, and no protected path is touched. The tier is STANDARD and no residual risk is marked unaccepted, so this does not escalate. Two stated assumptions stand: reading a vendor as active by matching the administrator's own status badge, and switching an account off and on leaving its acceptance alone. The ruling would become a return if the test asserted something its criterion does not state, if the typecheck regressed, or if calibration showed that switching an account back on withdraws its acceptance by itself.

**Conditions:**
- Carried forward, not the writer's: the mail helper (tests/fixtures/mail.ts) should expose a message's body so R-6.23 can confirm the link to read and accept the new terms.
- Carried forward, not the writer's: an administrator's view of another vendor's acceptance, or of its withdrawal, would let proponentThree (no persona) be checked for withdrawal and remove the step that switches deactivated vendors back on.
- Watch at calibration: if the administrator's own status badge text differs from an active vendor's, the given fails with every vendor read as deactivated. That would be a test or adapter issue, not a product one.

### Runner-owned typecheck evidence

Proposal revision: `852f0d8d9c058e931b10f9cc05cfbc0bbb8cc66e`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/notifications/`, which this proposal answers for.

    No diagnostics.
