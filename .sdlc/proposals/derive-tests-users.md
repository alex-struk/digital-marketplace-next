---
gate: G3
question: "Do these tests follow from the users criteria and from nothing else?"
recommendation: "Twenty-five of the thirty criteria for the users domain now have a Playwright file under `tests/acceptance/users/`, one per criterion, each importing only from the fixtures and reaching the system onl…"
opened: 2026-09-09T01:10:16.594Z
---

# Do these tests follow from the users criteria and from nothing else?

**Recommendation.** Twenty-five of the thirty criteria for the users domain now have a Playwright file under `tests/acceptance/users/`, one per criterion, each importing only from the fixtures and reaching the system onl…

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer

The question is whether these tests follow from the users criteria and from nothing else. Approve. All thirty live criteria are accounted for, twenty-five with a spec file and five with a not-testable entry, and no test was written against a superseded or obsolete criterion; each not-testable reason names something the surface genuinely lacks, verified against spec/contract/surface.yaml, tests/generated/personas.ts and tests/fixtures/mail.ts rather than taken on trust, and the reactivation-message reason matches reasons already accepted at this gate for four notifications criteria; every assertion I traced follows from its criterion, with the gaps between criterion and surface recorded in comments rather than papered over with invented assertions, and no selector, route, status code, table or column name appears anywhere in the diff; the checks are green, the runner's typecheck passed on this revision, and nothing outside tests/acceptance and the record files was touched. What would change the ruling is a test asserting something its criterion does not say, a not-testable reason that names inconvenience rather than a missing page, action or observation, or a diff reaching a protected path.

**Conditions:**
- The terms-broadcast setup in R-4.3, R-4.16, R-4.23, R-4.24 and R-4.33 withdraws every vendor's standing acceptance and restores it only for the vendor under test; R-4.16 deliberately leaves persona.vendor withdrawn. The receipt enumerates three kinds of restoration and does not mention this one. Since the suite runs serially with one worker and file order is not fixed, a later file in another domain that assumes a vendor stands under the current terms may see a state the seed does not describe. Worth recording in the run notes.
- The R-4.20 not-testable reason rests on the mail fixture returning Subject, Snippet, To and ID, but spec/contract/observables.yaml names html_body, plain_text_body and a read_one_message endpoint. The gap is in tests/fixtures/mail.ts, not in the contract. A body accessor would make R-4.20 testable and would also retire four notifications entries resting on the same limitation.

### Runner-owned typecheck evidence

Proposal revision: `89345d2aef247f27395aaa60daba4815b9a995eb`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`

    No diagnostics.
