---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-14T20:25:55.811Z"
cost: 1.9150045
turns: 22
session: "dd7c1453-9495-422a-994b-0d59b6991c78"
---

Both criteria now have tests: R-6.23 and R-6.28 each have a spec file in `tests/acceptance/notifications/`, and neither has an entry in `not-testable.yaml`. There were earlier approved files for both, carrying an older spec sha; I rewrote them with the new header lines. The tests have not been run or typechecked. Running the typecheck needed an approval I didn't have. The only check I could do was a search of both files for the patterns the separation check refuses, and it found none.

**R-6.23 (announcing changed terms).** One test, since the criterion has one given/when/then. The test:
- **Sets up the starting state.** The seed is applied once, and any announcement in the same run withdraws everyone's acceptance. So two active vendors (`vendorOne` and `organizationOwner`) each first accept the current terms if their own legal settings show a warning. The test then checks the warning is gone.
- **Makes the announcement.** The administrator opens the terms broadcast page, checks the control is there, starts the announcement, sees the confirmation, confirms, and reads the success message.
- **Checks email.** Both active vendors must get a further message. The deactivated vendor (`vendorDeactivated`) must get none. That absence is read only after the active vendors' messages have arrived, so the catcher is known to be working.
- **Checks the withdrawal.** The deactivated vendor can't sign in, so the administrator reads that vendor's legal settings through `userProfileLegal`, using the vendor's seed id. Each active vendor then signs in and sees the "terms updated" warning in their own settings.

The earlier file checked neither the deactivated vendor nor the starting state.

What this test cannot check is what the message says: that it names the change and links to the new terms. The mail fixture returns only a subject, a snippet, a recipient and an id, and the contract names no wording to look for.

**R-6.28 (skipping recipients with no address).** One test, since the criterion states no separate given/when/then. The seed's `vendorWithoutEmail` is an active vendor with no address. The test runs the same announcement and then requires a message to reach every active vendor who has an address. It builds that list from the seed: vendor accounts that have an email and no deactivated status. If the broadcast stopped at the vendor it cannot address, someone on that list would get nothing.

The earlier file had a hand-written list that left out `invitedVendor` and `vendorWithTermsReset`. The criterion says each active vendor is sent a message, so both are now included. If the service actually messages only vendors who had already accepted the terms, this test will fail. It will also fail when an earlier announcement in the same run has already withdrawn everyone's acceptance. Either failure is a real mismatch with the criterion, not a flaw in the test.

Two parts of R-6.28 have no assertion. The file's comment explains both:
- **Skipping versus composing a message to nobody is unobservable.** Either way nothing reaches the catcher, and the service records nothing about who it failed to reach. The difference shows only in the service's own log. No addition to the contract would help, short of exposing that log.
- **Continuing past a recipient who can't be reached is blocked.** Nothing in the surface or the mail fixture makes a single delivery fail. A target whose mail setup rejects one address, or can be told to, would unblock it.

**Gaps in the contract, by name:**
- **The mail fixture needs a way to read one message by id.** It should return the plain-text and HTML body, and ideally the blind-copy recipients too. `observables.yaml` already names `read_one_message`, `plain_text_body`, `html_body` and `copied_recipients`, but the fixture offers only the search listing. This is the one gap behind the unchecked message content in R-6.23. It also covers several criteria already listed as blocked on it: R-6.3 to R-6.5, R-6.8, R-6.9, R-6.11, R-6.12, R-6.15, R-6.16, R-6.18 and R-6.25.
- **A way to make delivery to one address fail.** R-6.28's unreachable-recipient half needs a mail catcher, or a variant of the target, that refuses one address while accepting the rest. R-6.2 is blocked on the same thing.
- **Something to put the terms acceptance back before a test.** R-6.23 and R-6.28 both withdraw every vendor's acceptance, and nothing resets it between tests. The workaround of having vendors re-accept only works for vendors who can sign in. A seeded deactivated vendor who has accepted the current terms, or a reset step before each test, would keep one test's announcement from shaping the starting state of the next.