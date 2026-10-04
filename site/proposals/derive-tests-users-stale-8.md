| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T10:24:36.823Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Do these tests follow from the users criteria and from nothing else?

**Recommendation.** I rewrote the test for the one criterion I was given, R-4.2 v1, in `tests/acceptance/users/R-4.2.spec.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I rewrote the test for the one criterion I was given, R-4.2 v1, in `tests/acceptance/users/R-4.2.spec.ts`. It now has the new header (spec@658792c3…, derived 2026-10-04). I did not run it, and I could not type-check it because the workspace has no installed dependencies.

**What the ruling found.** The old test checked the "no email address" case by requiring the mail catcher to be completely empty after the first sign-in. The criterion only says no welcome message is attempted for that person. Other criteria (R-1.1 and R-5.20) make that same sign-in send closing notices, so a correct application would still fail the old test.

**What the new test does.** It has one test for each outcome. Both tests now look only for a welcome message, which they recognise by a subject containing "welcome". Neither test counts messages, so other mail sent by the same sign-in no longer matters.

- **Person with an email address:** the test signs in as `persona.firstTimeVendor` and reads the shared address from the new account's own profile page, because the contract does not state it. It waits up to 10 seconds for a message with a welcoming subject to reach that address. It then opens that message and checks that it includes a link to sign in, which is what the criterion's given/when/then states.
- **Person with no email address:** the test signs in as `persona.firstTimeVendorWithoutEmail` and confirms the account exists because the profile shows a user identifier. It waits the same 10 seconds, then checks that no message subject in the catcher matches "welcome". There is no address to search by, so it checks every subject in the catcher.

**Choices someone may want to revisit:**
- The old positive test took the first message sent to the new address, which could have been one of the closing notices. It now picks a message with a welcoming subject.
- I dropped the old test's check that the no-email person's profile shows a blank email field. The persona already promises that, and the criterion asks nothing about the profile.
- Telling a welcome message apart by its subject is an assumption. The contract has no observation that labels a message's purpose. Something like `caughtMessage.kind()`, or a way to filter the catcher by notification type, would make the test exact.

**Not testable:** nothing. I made no changes to `not-testable.yaml`.

**Missing surface:** the one gap is that purpose observation; no other surface actions or observations were missing. Nothing asked me to change any read-only path, and I did not touch any.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: do the rewritten R-4.2 tests follow from the users criterion and from nothing else? Approve. The positive test reads the new account's address from its own profile, waits for a message to it whose subject welcomes the person, and checks that message offers a link back to sign in, which asserts every clause of the criterion's then-line for a person with an address. The withheld test confirms the account exists and then checks that no message in the catcher welcomes anyone, which asserts that no welcome is attempted. It no longer requires an empty catcher, which was the overreach the test-overreaches ruling named, because R-1.1 and R-5.20 make the same sign-in send closing notices. The word 'welcome' is the criterion's own, not an implementation detail. The oracle's welcome subject is 'Welcome to the Digital Marketplace' (sources/old/src/back-end/lib/mailer/notifications/user.tsx:12), so the subject heuristic matches the reference behaviour. messageSubjects() is declared Promise<string>, so toMatch is well-typed, and the runner's typecheck passed. Dropping the sign-in-required and empty-email-field checks removes assertions the criterion never made. No selector, route, table or status code leaks in, and nothing was marked not-testable. The ruling would change if a target's welcome message carried no 'welcome' in its subject or another notice's subject did. That would call for a contract observation of a message's purpose, which the proposal correctly names as the missing surface. This proposal does not touch build-slice-16-4#1, which is owed by build and stays open.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `099159be1609c53e441ed5473206f4124ebebf39`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/users/`, which this proposal answers for.

    No diagnostics.
