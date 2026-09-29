---
gate: G3
question: "Do the revised organizations tests now follow from their criteria and from nothing else?"
recommendation: "I changed only `tests/acceptance/organizations/R-3.24.spec.ts`."
opened: 2026-09-29T12:20:13.770Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do the revised organizations tests now follow from their criteria and from nothing else?

**Recommendation.** I changed only `tests/acceptance/organizations/R-3.24.spec.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I changed only `tests/acceptance/organizations/R-3.24.spec.ts`. No other test file, no `not-testable.yaml` entry and nothing under `tests/generated` was touched. The header stays as it was: the derived date was already 2026-09-29, which is today. I could not run the typecheck because the tool refused to run `tsc` without approval, so the edit has not been compiled. I checked the types by reading them instead: the `ID: string` field I added to the local mailbox type matches what the mail fixture's `messagesTo` returns, and `surface.caughtMessage` provides `open({ messageId })`, `subject()` and `plainTextBody()`, as the generated surface declares.

**Condition 1 (the message says an administrator archived the organization).** The administrator case still polls for 30 seconds until a message to the owner (seeded user `vendorOne`) mentions archiving. It then takes that message, opens it through `surface.caughtMessage.open({ messageId })`, and joins its subject and plain-text body. It asserts that text matches `/archiv/i` and `/admin/i`. That is loose enough that "archived by an administrator", "an admin has archived" or similar wording will all pass. To get the message's identifier I split the filtering helper in two: `archivingMessages` returns the matching messages, and `archivingMessagesTo` still returns the count, so the existing polling code did not change.

**Condition 2 (the message says the owner can no longer use it).** On the same subject and body text, the test asserts a "no longer / not be able / cannot / can't / unable" phrase followed, within the same sentence, by "use", "access" or "available". Wording isn't fixed, but the message has to state the loss of use.

**Condition 3 (keep the polling and the seeded records).** Nothing changed here. The administrator case still polls for the 30-second window and uses `seed.organizations.unqualified`. The owner case still watches the whole window before asserting that nothing arrived, and uses `seed.organizations.withPendingInvitation` with `persona.organizationOwner`. The helper split doesn't change what the owner case does.

With these assertions the test checks every clause of R-3.24's "then", so no clause entry was needed in `not-testable.yaml`. I acted on all three conditions. I found no contract gaps: the surface already provided everything the new assertions need.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the revised R-3.24 test follow from its criterion and nothing else? Approve. The administrator case now opens the archiving message through surface.caughtMessage and asserts that its subject and plain-text body say the organization was archived, that an administrator did it, and that the owner can no longer use or access it, with wording matched loosely. That is every part of the criterion's 'then'. The owner case watches the full settling window and asserts that no archiving message reaches the owner, which is the 'no such message' clause. No assertion goes beyond the criterion. The message ID used comes from the mail fixture's declared contract (tests/fixtures/mail.ts), not from the application. The runner typecheck reports no diagnostics under acceptance/organizations; its failures are in adapters/new, which this proposal does not answer for. Polling and seeded records are unchanged. What would change this: type errors in the organizations suite, or a clause of the 'then' left unasserted.

**Conditions:**
- condition-met derive-tests-organizations-stale-9#1: the administrator case opens the archiving message via surface.caughtMessage and asserts /admin/i on its subject plus plain-text body, in tests/acceptance/organizations/R-3.24.spec.ts
- condition-met derive-tests-organizations-stale-9#2: the same message text is asserted to contain a no-longer/cannot/unable phrase followed within the sentence by use/access/available, in tests/acceptance/organizations/R-3.24.spec.ts
- condition-met derive-tests-organizations-stale-9#3: both cases keep the 30-second settling window, and the seeded organizations stay seed.organizations.unqualified (administrator case) and seed.organizations.withPendingInvitation (owner case), in tests/acceptance/organizations/R-3.24.spec.ts

### Runner-owned typecheck evidence

Proposal revision: `8abab2b5afc3e9af261a3588023937ab1433a3c4`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/organizations/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
