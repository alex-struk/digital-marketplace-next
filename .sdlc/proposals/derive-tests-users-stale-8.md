---
gate: G3
question: "Do these tests follow from the users criteria and from nothing else?"
recommendation: "I rewrote the test for the one criterion I was given, R-4.2 v1, in `tests/acceptance/users/R-4.2.spec.ts`."
opened: 2026-10-04T10:24:36.823Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

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
