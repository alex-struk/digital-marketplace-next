---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-15T05:57:55.349Z"
cost: 1.6052674999999998
turns: 27
session: "cd0b81ee-d908-486d-b9f8-1758efa92b55"
---

No criteria in the users domain got a test this run. The one criterion listed, R-4.5 v1, is recorded as blocked in `tests/acceptance/not-testable.yaml`, and I deleted its old test file (`tests/acceptance/users/R-4.5.spec.ts`), so it has only the entry.

**Why it is blocked.** The criterion says a person who deactivated their own account comes back by signing in again. They get back in, the account is active again, and they get an email saying so. The redo notes said the old test's sign-in was not an ordinary one on this target. They asked for an ordinary sign-in, or a blocked entry if the target has none. The contract confirms it has none:
- **`surface.signIn`** uses the "session-route" method in `personas.yaml` on the oracle (the old application). D-users-29 and the openapi entry for the direct vendor route both say that route creates a session without the identity provider and without checking the account's status. That skips exactly the check that reactivates the account.
- **`userSignIn.signInAsVendor`**, which the old test used, sends the person off to the identity provider. Nothing in the contract finishes that sign-in for a seeded persona on the oracle.

A test built on either would report what some other kind of sign-in does, not what the criterion describes. I did not treat this as unobservable: an ordinary sign-in that completes would make the whole criterion testable.

**Everything else is already reachable.** The vendor can deactivate their own account from their own profile (`userProfileSelf.deactivateAccount` then `confirmActivationChange`). An administrator can see the account is active again with `userProfile.statusBadge`. `mail.messagesTo(seed.users.vendorOne.email)` catches the email.

**What the contract needs, by name:**
1. **An ordinary sign-in a test can complete** for a seeded persona on every target. Either the "sandbox-idp" method configured for the oracle too, or a `userSignIn` action that finishes the identity provider's sign-in for a named persona. This one gap unblocks R-4.5.
2. **A way to read one email's body.** Without it a test can't tell the "you reactivated your account" email from other emails, only from the subject and the short excerpt the mail catcher lists. The mail fixture needs an accessor over `observables.yaml`'s `read_one_message`, returning the plain-text or HTML body. R-4.20's entry already asks for this.

**Two things I noticed but did not change, because they are not my criteria:**
- R-4.4 has an approved test that signs in the same way. On the oracle, that sign-in skips the status check the test is about, so it probably needs the same review.
- R-4.20's existing entry says a self-deactivated vendor signing in again "can be produced". This finding contradicts that, so that entry's reason is now partly out of date.

I couldn't run the YAML parser because it needed approval. Instead I checked by reading the lines: the new entry is between R-4.2 and R-4.13, indented like its neighbours, and appears once.