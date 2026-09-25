---
gate: G3
question: "Do these tests follow from the users criteria and from nothing else?"
recommendation: "I wrote tests for all five criteria that came back to this stage: R-4.1, R-4.2, R-4.5, R-4.20 and R-4.21."
opened: 2026-09-25T11:11:16.916Z
---

# Do these tests follow from the users criteria and from nothing else?

**Recommendation.** I wrote tests for all five criteria that came back to this stage: R-4.1, R-4.2, R-4.5, R-4.20 and R-4.21.

I wrote tests for all five criteria that came back to this stage: R-4.1, R-4.2, R-4.5, R-4.20 and R-4.21. Each is now a file under `tests/acceptance/users/`, and I removed all five entries from `tests/acceptance/not-testable.yaml`, so none of them is both a test and an entry. No criterion in this run is left untestable. I could not typecheck or run anything: the sandbox refused `tsc`, so the files have been checked by reading only, against `tests/generated/surface.d.ts`, and not by the compiler.

The five criteria became 14 tests:

- **R-4.1 (two tests: a government identity, a code-hosting identity).** The contract now has two personas with no seeded account, `firstTimePublicSectorEmployee` and `firstTimeVendor`, and the harness resets to the seed before every test. Each test signs in for the first time and reads the person's own profile (`userProfileSelf`, which needs no identifier). It checks that the account exists, is active, has the right kind and carries the persona's own username. It then signs out, signs in again, and checks the profile has the same account identifier, which is how "the same account is reused" is observed.
  - The contract doesn't say what name and email address the identity provider supplies, so the tests only check that both are present, not what they are.
  - The criterion's note about an identity the service recognises as neither kind has no persona. It is a note rather than a stated outcome, so it has no test.
- **R-4.2 (two tests: welcomed, not welcomed).**
  - For the welcome, `firstTimeVendor` signs in, its address is read off its own profile, and the message is found in the mail catcher and opened through `caughtMessage`. The test checks for "welcome" in the subject or plain-text body, and for a sign-in link in `linksInBody`.
  - For the withheld half, the catcher is emptied first, then `firstTimeVendorWithoutEmail` signs in. Once the account is seen to exist with no address, `caughtMessageList.messageCount` must be zero. A message could still be sent after that check runs; I accepted that risk.
- **R-4.5 (one test).** `selfReactivatingVendor` (`seed.users.vendorReturning`) deactivates their own account from their profile and sees the deactivation notice. The catcher is then emptied, so the message about deactivating isn't mistaken for the next one, and the person signs in again. The test checks they are signed in, as the same account, with an active status, and that a message to their address says "successfully reactivated", the wording the criterion itself uses.
- **R-4.20 (three tests).**
  - An administrator reactivates `seed.users.vendorDeactivated`. The plain-text body names an administrator, "reactivated", "Digital Marketplace" and someone to contact.
  - Separately, after that same reactivation, no message to them contains the self-reactivation wording.
  - A self-deactivated person who signs in again does receive the self-reactivation message.

  Telling the two messages apart rests on "successfully reactivated" for one and "administrator" for the other. That is the closest the criteria come to stating the wording. If the real text differs, these tests will fail for that reason and not because of the behaviour.
- **R-4.21 (four tests).** These read the service's answer through `userListRequest`, not the screen. An administrator is answered, and the answer includes a seeded vendor's address. A public sector employee who is not an administrator (`persona.publicSectorStaff`), a vendor, and a visitor who is not signed in are each refused. For each refusal, `refusedWhenNotPermitted` and `refusalStatus` must both be present, and the answer must not contain any seeded address.

**Tests that will not pass on the oracle.** Every test that signs in as one of the three first-time personas or as `selfReactivatingVendor` can only run against the rebuilt target: `personas.yaml` marks those personas unavailable on the oracle. That covers R-4.1, R-4.2, R-4.5 and R-4.20's self-reactivation test. This is a limit of the target the contract states, not a gap in the tests. The oracle can only confirm R-4.20's two administrator tests and R-4.21.

**Nothing is missing from the surface for these criteria.** The pieces the earlier entries asked for are now all in the contract, and each was enough:

- the first-time personas;
- a self-reactivating persona that signs in through the identity provider;
- `caughtMessage.plainTextBody` and `linksInBody`;
- `caughtMessageList.messageCount`;
- `userListRequest.refusedWhenNotPermitted` and `refusalStatus`.

The one thing the contract could still add is a persona whose identity is recognised as neither kind, for R-4.1's note about the refusal.

**One thing to flag.** The remaining entries in `not-testable.yaml` from earlier runs, such as R-4.13 and R-7.11, have no `missing` or `owner` field, which the run rules say will be refused. I didn't change them because they are outside the criteria this run was given, but whoever next edits that file will have to fill them in. Nothing outside `tests/acceptance` was changed.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Question: do the fourteen new tests for R-4.1, R-4.2, R-4.5, R-4.20 and R-4.21 follow from those criteria and nothing else? Approve. Each assertion traces to its criterion's text. R-4.1 checks an active account of the right kind carrying the persona's own sandbox username (first-time-gov / first-time-vendor, as personas.yaml names them), with name and email held only to being present since the contract never states their values, and observes reuse by the account identifier across a second sign-in. R-4.2 checks welcome wording plus a sign-in link via caught-message.links_in_body, and shows the withheld half by an emptied catcher's message count, the only observation that can show nothing was attempted for a person with no address. R-4.5 checks that the person is signed in, active and the same account, plus the criterion's own 'successfully reactivated' wording. R-4.20 separates the administrator's message from the self-reactivation one by the criterion's terms. R-4.21 reads user-list-request, which the contract defines as the service's answer whatever the screen shows, and keeps a refusal apart from an empty answer, which is the distinction that separates it from the superseded R-4.15. No selector, route, table or implementation detail leaks into any test. Every not-testable entry removed was a 'blocked' entry whose named missing pieces the contract now carries. The runner's typecheck reports no diagnostics under acceptance/users/; its one failure is in adapters/new/, outside this proposal. The softest assertion is R-4.20's /contact/ match: the criterion requires the message to say whom to contact, and a message naming a contact without the word would fail on wording rather than behaviour. The author declared that risk, and at calibration it would be a product question rather than a defect in the test. What would change this ruling: a typecheck diagnostic under acceptance/users/, or evidence that the mail catcher is shared across parallel instances so that R-4.2's zero-count check cannot hold. The owed missing-test conditions for these five criteria stay open until their tests run.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `4f09bd7773f0ece3d85c74d97083b29717a3f910`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/users/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 1 diagnostic
