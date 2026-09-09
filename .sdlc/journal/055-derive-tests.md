---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-09T01:10:16.307Z"
cost: 9.054994000000002
turns: 82
session: "7e893bfb-5e4e-4641-ad6a-d6db41c6aff7"
---

Twenty-five of the thirty criteria for the users domain now have a Playwright file under `tests/acceptance/users/`, one per criterion, each importing only from the fixtures and reaching the system only through `surface`, `persona`, `seed` and `mail`. Five criteria have entries in `tests/acceptance/not-testable.yaml` instead. I touched nothing else.

The five that got no file, and why:

- **R-4.1 and R-4.2** both start from an account being created. Every persona signs in as an account the seed already carries, and no action in the surface creates one, so a first sign-in cannot be made and the welcome message that follows it has nothing to follow.
- **R-4.13** starts from a service with no administrator at all. The seed carries one, nothing removes an account, and the outcome is the absence of a way to make the first administrator, which is not something an observation returns.
- **R-4.20** turns on which of two messages was sent. They differ only in wording, and the mail fixture returns subject, snippet, recipient and identifier but no body.
- **R-4.21** turns on a request being refused rather than answered, and the user list carries no refusal observation. A test could only show that a non-administrator sees no rows, which was equally true of the superseded criterion where the service answered the request in full.

Several files cover a criterion in part, and each says so in a comment at the top. The recurring reason is that the only request the surface can make is the control on the screen, so a rule that withholds the control also removes the way to test the service behind it. That blocks the profile change submitted against another person's account, the refused reactivation of a self-deactivated account, and the refused second deactivation of an account already inactive.

What the contract would need to reach the rest:

- A persona with no seeded account, or a sign-in that carries a fresh identity, so an account can be watched coming into existence.
- A name on each seeded user handle. The seed names no one, and only an account's owner may set a name, so the deactivated account can never be given one. I could assert the user list orders by name among two vendors I named through their own profiles, but not that active accounts precede inactive ones.
- A mail accessor for the message body. Four criteria here assert only that a message arrived, because the wording is the claim.
- `user-list.refused_for_non_administrator`, matching what the content surfaces already carry.
- An observation returning the exported contact list itself. Nothing reads the document, so only the rule about choosing at least one kind and one field is covered.
- Actions that send a profile change, a deactivation or a reactivation independently of the control being offered.
- A starting point on `surface.signIn`, so that being returned to the screen sign-in began from can be set up.
- Observations for the date and actor recorded on a deactivation, and for the two separate terms-acceptance dates the legal section collapses into one notice.

Tests that leave an account changed put it back: self-deactivated accounts are signed back in, granted administrator rights are withdrawn, and the notification choice the seed defines is restored. I could not run the suite. No dependencies are installed in this workspace, so there is no type check or test run behind this report; correctness here rests on reading the generated surface, the seed and the existing tests in the other domains.