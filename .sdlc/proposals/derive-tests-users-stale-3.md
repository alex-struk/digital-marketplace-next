---
gate: G3
question: "Do these tests follow from the users criteria and from nothing else?"
recommendation: "No criteria in the users domain got a test this run."
opened: 2026-09-15T05:57:55.362Z
---

# Do these tests follow from the users criteria and from nothing else?

**Recommendation.** No criteria in the users domain got a test this run.

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Question: do the users tests follow from their criteria and nothing else? This run adds no tests. It deletes the R-4.5 test and records R-4.5 v1 as blocked, so the question is whether that reason is real, and it is. The criterion's when is 'they sign in again', and the reactivation it cites (auth.ts:494) happens inside that sign-in. On the oracle the adapter's signIn uses the persona's session route (tests/adapters/old/index.ts:1541-1563), which personas.yaml:6-13 describes as creating a session for a fixed account and which the archaeology ruling says does not check account status. The adapter's identity-provider path reports unbound on the oracle because 'Sign In Using GitHub' goes to github.com itself, not to a sandbox provider (index.ts:1584-1587). A test on either path would record some other sign-in, not the one described. The reason names the missing capability (an ordinary identity-provider sign-in a test can complete for a seeded persona), shows the given, the status check and the mail are already reachable, and does exactly what calibrate-old-5 and calibrate-old-6 asked for when no ordinary sign-in exists. Its phrase 'no target' overstates slightly, since the new target is set up for sandbox-idp, but calibration runs on the oracle, which cannot do this, so the block stands. Removing R-4.5 from redo.yaml and tests/results/old/applied.yaml matches the approved derive-tests-proposals-stale-2 change for R-2.13. No protected path is touched, checks pass, typecheck is clean, the tier is STANDARD and no residual risk is unaccepted, so no escalation. This would become a return given evidence that the oracle adapter can complete a real identity-provider sign-in for the vendor persona, or that reactivation happens outside sign-in.

**Conditions:**
- Re-derive R-4.5 when the contract gains an ordinary identity-provider sign-in a test can complete for a seeded vendor on the oracle, and use the single-message mail accessor (read_one_message) R-4.20 asks for to tell the reactivation email apart instead of matching the word 'reactivated' in the subject and excerpt.
- The R-4.4 and R-4.20 concerns the proposal raises are outside this slice and are not ruled here. They belong to whoever next re-derives or calibrates those criteria; the adapter's identity-provider sign-in for R-4.4 already reports unbound on the oracle rather than silently using the session route.

### Runner-owned typecheck evidence

Proposal revision: `2bdaf6f4e3b3ba073fd9987489a6e282ddb476cd`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/users/`, which this proposal answers for.

    No diagnostics.
