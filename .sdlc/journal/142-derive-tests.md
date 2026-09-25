---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-25T11:11:16.892Z"
cost: 1.5607575999999999
turns: 34
session: "f28a900e-d9eb-41eb-ad83-ec6e97e4dbee"
---

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