---
gate: G3
question: "Do these tests follow from the notifications criteria and from nothing else?"
recommendation: "I wrote tests for both notifications criteria, R-6.23 and R-6.28, and recorded neither as not testable."
opened: 2026-09-14T23:20:57.439Z
---

# Do these tests follow from the notifications criteria and from nothing else?

**Recommendation.** I wrote tests for both notifications criteria, R-6.23 and R-6.28, and recorded neither as not testable.

I wrote tests for both notifications criteria, R-6.23 and R-6.28, and recorded neither as not testable. Nothing was run and nothing was type-checked: the workspace has no TypeScript compiler and no adapter. I checked by hand that every call matches `surface.d.ts`, `seed.ts` and the `mail` fixture.

Both files already existed from an earlier derivation against an older spec sha, and neither criterion had an entry in `not-testable.yaml`. So I rewrote both files, with the new header, instead of starting over.

**R-6.23: announcing changed terms.** The criterion has one given/when/then, so there is one test.
- **Given:** the seed already holds the mix the criterion describes. Several active vendors had accepted the terms, and `seed.users.vendorDeactivated` had accepted them before being deactivated.
- **Announcement:** the administrator opens `notificationTermsBroadcast`, sees `notifyVendorsControl`, starts the announcement, sees `notifyVendorsConfirmation`, confirms, and reads `notifyVendorsSuccess`.
- **Messages:** each of ten active vendors with an address must receive a new message. Its subject or snippet must mention the terms. The earlier version checked only two vendors and never looked at content.
- **Withdrawn acceptance:** two active vendors read `termsUpdatedWarning` on their own legal page (`userProfileSelfLegal`). The earlier version checked no deactivated vendor. Now the administrator also opens the deactivated vendor's legal page (`userProfileLegal`) by seed id, because "every vendor" includes deactivated ones and that vendor can't sign in.
- **Not asserted:** that the deactivated vendor gets no message. The spec says so only in a note, not in the statement.

**R-6.28: skipping a recipient with no address.** There is one test, built on the same broadcast. `seed.users.vendorWithoutEmail` is among the active vendors. The test requires the announcement to report success and every addressable vendor to still receive a message. The earlier version left out `invitedVendor` and `vendorWithTermsReset`. Two parts of the criterion are not asserted, and the file says so:
- **"Rather than composing a message addressed to nobody":** both behaviours leave the same trace. A message with no recipient can never arrive in the mail catcher, so the difference exists only inside the service. No addition to the contract would change that.
- **"Cannot reach":** this is blocked. Every seeded address is one the catcher accepts, and nothing in the surface can make a single delivery fail. Two additions would unblock it: a seeded active vendor whose address the catcher refuses (for example, by limiting which recipients it accepts), and a vendor for whom the no-address vendor can be made to come first.
- **Ordering:** the test can't control whether the unaddressable vendor comes before the others. It only proves the run went past that vendor if the service happens to reach them early.

**Risk for whoever runs these.** `mail.messagesTo` searches only by visible recipient. The contract's mail notes say large announcements go out in batches with blind copies. If the terms announcement is batched that way, both tests fail against a correct service because they can't see the blind copies. I assumed one message per vendor. R-6.26's own wording supports that, and the R-6.26 test already in the workspace assumes the same.

**Missing from the contract, by name:**
- **A `mail` accessor that searches blind-copy recipients.** The R-6.17 test already lacks it.
- **A `mail` accessor that reads one message's body.** The contract's mail notes say this is needed, and it would let R-6.23 check the request to read and accept the new terms.
- **A seeded recipient the catcher refuses.**
- **An observation for a message the service skipped or failed to deliver.** Nothing on `notificationTermsBroadcast` shows one; `notifyVendorsFailure` covers the announcement as a whole, not a single recipient.
