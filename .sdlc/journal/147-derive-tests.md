---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-25T12:14:35.226Z"
cost: 3.6819360000000008
turns: 62
session: "c3a97eed-4278-4953-b446-5e4dda66a9b2"
---

I wrote tests for all ten criteria that were handed back, so none of them is left untestable. Each test file is in `tests/acceptance/notifications/` and starts with the two header lines the prompt gave. I removed all ten entries from `tests/acceptance/not-testable.yaml`, so each criterion is now either a test or an entry, never both. I did not add any new entries. The tests have not been run or typechecked: the workspace has no TypeScript compiler installed, and installing one was not this stage's job. I checked the seed handles, persona names and surface members against the generated files by hand. The tests use only `surface`, `persona`, `seed` and `mail`, and a search of the new files found none of the patterns the separation check refuses.

What unblocked them was the contract's new mail pages: `caughtMessage` (one message's recipients, blind copies, sender, reply-to, subject, both bodies, logo address and links), `caughtMessageList`, and `mailDeliveryFault`. It also added the named values in `observables.yaml` (the configured sender and address, the test marker, the batch size, and which messages the preference governs), `seed.subscribers`, `seed.opportunities.cwuLapsedForAwardNotices`, and the `first-time-vendor` persona. Wherever a test compares against a contract value — the service's do-not-reply address, "Digital Marketplace", "[TEST] ", `images/logo_test.png`, the batch size of fifty — a comment points to where `observables.yaml` names it.

How each criterion is exercised:

- **R-6.2:** the mail catcher is set to refuse delivery, then an administrator publishes a Code With Us opportunity. The test checks the opportunity is published, the form shows no error, and its history records no failed delivery. It then restores delivery and sends an organization invitation to prove the catcher is accepting again. After a margin, nothing but that invitation may be in the catcher: no announcement sent again. The fault is lifted in a `finally` block, pass or fail. Only the "cannot be delivered" half is exercised. Nothing in the contract can make a message fail to compose, so that half has no test.
- **R-6.3, R-6.4 and R-6.5:** each sends three kinds of message: an organization invitation, a new-opportunity announcement and the changed-terms announcement. Each then reads one message per distinct subject in full.
  - R-6.3 checks the subject starts with the test marker and the logo is the test variant.
  - R-6.4 checks the sender carries the service's name and exactly the do-not-reply address, that the sender is the same across all kinds, and that the reply-to names nothing else.
  - R-6.5 checks that every word shown in the formatted body appears in the plain text, that the plain text adds no words the formatted body lacks, and that every link address is written out in the plain text.
- **R-6.8:** an administrator publishes an opportunity, and the test reads every message addressed to the service's own address until the blind copies cover all 120 seeded subscribers. There must be exactly three batches, none carrying more than fifty blind copies, and each showing only the service's own address as the visible recipient.
- **R-6.15:** two tests, because the criterion names two notices.
  - Panel notice: two people are added at once to a published Sprint With Us panel.
  - Owner notice: the chair submits the consensus on the seeded closed Team With Us opportunity, which tells the owner and both administrators (the same route the existing R-5.31 test takes).
  - In both, any message reaching more than one person must show only the service's address and carry the people as blind copies, and nobody may be shown to anybody else.
- **R-6.16:** uses an organization invitation, which the notification preference does not govern. The message must offer no unsubscribe link and say nothing about stopping messages. Its link to the reader's notification settings is followed while signed in as the reader. It must land on their own settings, not with the unsubscribe question already asked.
- **R-6.18:** in the changed-terms message, both the formatted and the plain-text forms must name all three programs or none.
- **R-6.20:** `persona.firstTimeVendor` signs in and finishes their profile without touching the notification choice. The notification control on their own settings must read the same as it does for the seeded vendor who has notices off. A later announcement must reach every subscriber and not the new account. This persona can only sign in on the rebuilt target, never on the oracle, as its own definition says.
- **R-6.25:** the seeded Code With Us opportunity is closed, all three proposals are scored, and the first is awarded. The winner's name is taken from the seed's legal name for its organization and checked against the opportunity's own record of the successful proponent. For each of the two vendors not chosen, the message must name the title and the winner ahead of the sign-in offer (which is how I read "leads with"), carry a sign-in link, and mention the reader's score.

Two parts have no test yet:

- **The em dash in R-6.25:** it only appears when an award has no successful proponent recorded, and no action makes such an award.
- **"Cannot be composed" in R-6.2:** nothing can make a message fail to compose.

If `contract` wants those covered, it would need to supply two things:

- a seeded awarded opportunity with no successful proponent, together with a way to send its not-awarded notice;
- a way to make composing a message fail.

A few assumptions could make these tests fail even if the target is correct. The `caughtMessage` readings (recipients, sender, bodies) and `deliveryRefused` are each handed back as a single string, and the contract doesn't say what shape it takes. The tests pull email addresses out with a pattern and parse the list of message identifiers loosely, the same way the existing R-5.17 test does. Pinning down those formats in `surface.yaml` would make the tests less fragile.

Nothing asked me to change a file outside `tests/acceptance`, and I didn't. My one attempt to run a helper script over `not-testable.yaml` was declined, so I made the same removals directly with the editor.