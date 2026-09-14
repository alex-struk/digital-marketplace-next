| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-14T01:41:27.166Z |
| holder | agent:reviewer |

# Do these tests follow from the notifications criteria and from nothing else?

**Recommendation.** Of the 21 notification criteria, 9 now have a test file and 12 have a `not-testable.yaml` entry.

Of the 21 notification criteria, 9 now have a test file and 12 have a `not-testable.yaml` entry. I checked that none has both. I haven't run or typechecked anything: the workspace has no installed packages, and running a compiler would have needed approval. So "these compile" and "these pass" are both unconfirmed.

**What I found on arrival.** An earlier run had already written notification tests and not-testable entries, against an older contract. Those files no longer matched the current page definitions. For example, they opened the notification settings page with no account id, which the page now requires. I rewrote every file for a criterion on my list rather than patching them. I used the pages that belong to whoever is signed in (their own notification settings, own legal page) wherever a test only needed that person's own record.

**Tests written:**
- **R-6.6:** reads the destination of the unsubscribe offer: the reader's own settings, with the confirmation naming their address. It also checks that the reference page's sample messages carry the word "Unsubscribe". It can't show that the offer ends every real message, because the message body is unreadable.
- **R-6.7:** two tests. A second person opens the offer and it acts on them, while the original addressee's setting stays unchanged. A signed-out visitor is asked to sign in.
- **R-6.13:** the reference page shows group titles, subjects, summaries and bodies, and no email address from the seed appears in those bodies.
- **R-6.17:** two tests.
  - For "no notification of any kind" I used an organization invitation, which is addressed to the person directly. Straight after, an active person is invited too; their message proves the mail catcher is working, so the missing message for the deactivated account means something. The notice about a watched opportunity, which the criterion names, can't be checked.
  - The second test shows the watcher count is the same after the account is deactivated and reactivated. Both tests reactivate the account afterwards.
- **R-6.19:** nothing in the contract lists every message, so this only checks that the two groups missing from the page before (evaluation panel notices and consensus notices) now appear. It searches for the words "panel" and "consensus", which is my guess at the wording.
- **R-6.21:** turns notices on and then off from the opportunity list, and reads the saved setting back from the person's own settings each time. It doesn't check that the change takes effect for the next opportunity published.
- **R-6.23:** after the announcement, two vendors each receive a message and each sees the "terms updated" warning on their own legal page.
- **R-6.27:** sets a phone-sized window (a Playwright viewport setting, not anything that reaches into the app) and switches the control on and off from the list. The old entry had called this untestable only because no way to set the width had been found.
- **R-6.28:** during the changed-terms broadcast, which includes the vendor with no email address, every vendor that has one still receives a message. It doesn't check that a message addressed to nobody is never put together. It also can't produce a recipient the service can address but not reach.

**Not testable — all blocked, none unobservable.** Most of these come down to one gap. The mail fixture only offers `messagesTo`, `latestTo` and `clear`, which return a subject, a snippet, the visible recipient and an ID. `observables.yaml` already says one message must be readable by its ID, with its sender, blind copies, formatted body and plain-text body. Adding that accessor to the fixture would unblock or partly unblock R-6.3, R-6.4, R-6.5, R-6.8, R-6.15, R-6.16, R-6.18 and R-6.25. It would also strengthen R-6.6, R-6.17, R-6.21 and R-6.28.

The remaining gaps:
- **R-6.1:** needs a target started with notifications switched off.
- **R-6.2:** needs a target whose mail server can't be reached.
- **R-6.3:** needs the contract to say what the test marker in a subject looks like.
- **R-6.4 and R-6.15:** need the configured sender, and the service's own visible address, named in the contract.
- **R-6.8:** needs more than fifty seeded accounts with new-opportunity notices on, or a smaller batch size named for the test setup.
- **R-6.16:** needs the contract to say which messages the notification preference controls.
- **R-6.20:** needs a persona that signs in with an identity the seed doesn't already hold, so an account can be created.
- **R-6.24:** needs a way to hold or slow delivery to the mail catcher.
- **R-6.25:** needs a seeded Code With Us opportunity that has closed with three submitted proposals.
- **Reference page (R-6.16 and R-6.18):** the page only returns all its message bodies as one block of text; a way to read one message's body would help these two.

**Left for someone else to decide:**
- **Leftover files:** test files for the replaced criteria R-6.10, R-6.14, R-6.22 and R-6.26 are still in the folder, from the earlier run. R-6.14's file asserts the opposite of R-6.19, so both can't pass. They weren't on my list, so I didn't touch them; they should probably be removed. The old not-testable entries for R-6.9, R-6.11 and R-6.12, also replaced, are still there too.
- **Criteria that conflict:** R-6.6 v2 says the Unsubscribe offer appears on every message. R-6.16 says messages the preference doesn't control must not offer it. Both are accepted, so this needs a ruling.
- **Other domains' tests:** some from this run open the other-person profile page with `{ user: ... }` instead of the `{ userId }` the page expects, so they will likely fail typecheck.

## Fix turn

I fixed all three compile errors, but I couldn't confirm it: the type-check command needed an approval this session doesn't have, so the next check is what will prove it.

**R-6.10:** `surface.organizationEdit.open()` takes `{ orgId }`, but the file passed `{ organization }`. I renamed the key and left the value, `seed.organizations.qualified.id`, as it was.

**R-6.13:** the seed file is declared `as const`, so each email's type is its exact string or `null`. A type-guard saying "this is a `string`" isn't allowed to narrow a type that specific. I replaced the `.map().filter()` with a `flatMap` that drops the `null` emails and needs no type guard. What the test checks hasn't changed.

**R-6.22:** `surface.userProfileNotifications.open()` needs a `userId`, and the file called it with nothing. The test signs in as `persona.vendor`, which signs in as `test-vendor-1`, the seed's `vendorOne`. I now pass `{ userId: seed.users.vendorOne.id }` and added `seed` to the file's import from `../../fixtures`. I found no page for a person's own settings that asks for no identifier.

R-6.10 and R-6.22 aren't in this run's list of criteria. They came over from the last approved version, and their headers still carry the older spec commit (`40605384…`). You asked me to fix only what the errors named, so I left their headers and whether they should exist alone. Whoever reviews this should decide what to do with them.

**Journal addition:** I fixed the three compile errors the suite reported and changed nothing else. R-6.10 passed its organization to the edit page under the wrong key, so I renamed it to `orgId`. R-6.13 used a type-guard that the seed's exact literal types don't allow, so I switched to a `flatMap` that drops missing emails and keeps the test's meaning. R-6.22 opened the profile notifications page with no user, so it now passes the seed id of the account `persona.vendor` signs in as. I couldn't run the type-check, so the compile check still has to confirm the fixes. R-6.10 and R-6.22 are carried over from the last approved version, still name the older spec commit, and aren't among this run's criteria; I didn't touch those questions and they need a decision.

## Ruling

**Verdict:** return
**By:** agent:reviewer

Question: do these tests follow from the notifications criteria and from nothing else? Ruling: return. Most of the slice holds. The runner's typecheck reports no diagnostics under acceptance/notifications/, so the fix turn worked. R-6.7, R-6.13, R-6.21, R-6.23 and R-6.27 assert only what their criteria state. R-6.17's second test now establishes that the watch registered before using the count as a baseline. Every not-testable reason names a real missing accessor, target variant or seed state. Two tests assert what their criteria do not say, and the brief requires a return for that. (1) R-6.28 adds `expect(notifyVendorsSuccess()).toBeTruthy()`. R-6.28 says only that a recipient with no address is skipped and that a broadcast continues past recipients it cannot address or reach. It says nothing about reporting success, and the contract also defines notify_vendors_failure. A service that continues correctly and then reports partial delivery would fail this test for a reason outside the criterion. (2) R-6.6 asserts `unsubscribeConfirmation()` contains vendorOne's email address. R-6.6 v2 says the offer opens the reader's own settings with the confirmation already asked; naming the address is R-6.7's then-clause, not R-6.6's. The contract already provides resolves_to_signed_in_person, which matches 'own' directly. What would change the ruling: drop the success assertion from R-6.28, and replace the address assertion in R-6.6 with resolvesToSignedInPerson() (or remove it).

**Conditions:**
- R-6.28: remove the notifyVendorsSuccess() assertion; the criterion does not state that the administrator is told the broadcast succeeded.
- R-6.6: replace `unsubscribeConfirmation()).toContain(seed.users.vendorOne.email)` with an assertion on resolvesToSignedInPerson(), which is what 'the reader's own notification settings' states; keep the confirmation-present check.
- Recommended, not blocking: R-6.19 searches for the guessed word 'panel'; either tie it to wording the spec uses ('evaluation panel', as R-6.15 does) or state the guess as a narrowing in the file header.
- Recommended, not blocking: R-6.7 should use the contract's confirmationNamesSignedInAddress() rather than a substring match on the free-text unsubscribeConfirmation(), which assumes that observation's content.
- For the suite owner, outside this slice: R-6.10, R-6.14, R-6.22 and R-6.26 test superseded criteria (checks warn on all four), and R-6.14 and R-6.22 assert the opposite of R-6.19 and R-6.27. Decide whether they stay as oracle-only tests or are removed.
- For the spec owner: R-6.6 v2 (Unsubscribe on every message, note still pointing at superseded R-6.10) conflicts with R-6.16 (messages the preference does not govern must not offer Unsubscribe). One of them needs a new version.

### Runner-owned typecheck evidence

Proposal revision: `efd468b036126da6cd50541038da85b35d173d12`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/notifications/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    acceptance/users/: 89 diagnostics
    acceptance/files/: 13 diagnostics
