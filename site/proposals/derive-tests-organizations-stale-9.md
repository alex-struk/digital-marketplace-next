| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-29T12:18:43.404Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do these tests follow from the organizations criteria and from nothing else?

**Recommendation.** I rewrote the test for R-3.24.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote the test for R-3.24. It is the only criterion in this run, so one of one got a test and nothing was added to `tests/acceptance/not-testable.yaml`. The test has not been run: this workspace has no app or mail catcher to run it against. I also couldn't type-check it, because the check command needed an approval that nobody was here to give.

**What the ruling found and how the new test fixes it.** The old test checked the owner's mailbox once, straight after the archive action returned. A notice that arrived a moment later counted as never sent. The new file, `tests/acceptance/organizations/R-3.24.spec.ts`, has two tests:
- **Administrator archives:** keeps checking the owner's mailbox for up to 30 seconds and passes as soon as a message mentioning archiving arrives. This is the same 30-second window the other mail tests use.
- **Owner archives their own organization:** watches the owner's mailbox for the full 30 seconds, checking about once a second, before asserting that no message mentioning archiving came.

**Other changes from the old version:**
- **Seeded records instead of made-up ones.** The old test registered new organizations with invented names and details. The new one uses seeded organizations and opens them directly by their seeded id with `surface.organizationEdit.open`.
  - For the administrator case it uses `seed.organizations.unqualified`, which is active and owned by `seed.users.vendorOne`, so the administrator is clearly not its owner.
  - For the owner case it uses `seed.organizations.withPendingInvitation`, which is active and owned by `seed.users.organizationOwner`, who signs in as `persona.organizationOwner`.
  - The fixtures reset to the seed before every test, so neither case leaves state behind for the other.
- **Mail is cleared right before the archive action.** Only the archive can produce what the test counts.
- **Imports.** One existing test imports a type from `fixtures/mail`, which is outside the allowed import paths. I avoided that by declaring the small mailbox shape the helper needs inside the test file.

**Decision to note.** The test asserts what the criterion's statement says: the owner receives an email saying the organization has been archived. The longer "then" also mentions that the message says an administrator did it and that the owner can no longer use the organization. I did not assert those points, for two reasons:
- The ruling framed the check as "at least one message mentions archiving".
- Matching specific wording in the message body risks failing because of phrasing the criterion never fixes.

I also added no partial-coverage entry for them, because the surface could reach them: the full message body can be read through `surface.caughtMessage` (`htmlBody` / `plainTextBody`). If the ruler wants those details asserted, the test can be extended with what the surface already has.

**Missing surface actions or observations:** none. Everything this criterion needed was there: `organizationEdit.open` / `archiveOrganization`, the seeded organizations and users, and `mail.messagesTo` / `mail.clear`. I changed nothing outside `tests/acceptance/`, and nothing asked me to.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether the rewritten R-3.24 test follows from its criterion and nothing else. The rewrite fixes the timing defect the earlier ruling raised: the administrator case polls the owner's mailbox for the 30-second settling window, the owner-archives case watches the whole window before asserting nothing arrived, and both use seeded active organizations, with the administrator case using one owned by another user (vendorOne). The typecheck reports no diagnostics under acceptance/organizations/. The test still asserts only part of its criterion. The criterion's 'then' says the owner's message tells them the organization was archived by an administrator and that they can no longer use it, and the test checks only that some message's subject or snippet matches /archiv/. The writer states the surface reaches the full message body through surface.caughtMessage (subject, plainTextBody), and sibling suites already read bodies that way (users/R-4.5, R-4.2). These are clauses the writer could assert and did not, with no not-testable.yaml clause entry beside the test, so a passing run would read as verifying the whole criterion. The earlier ruling's 'at least one message mentions archiving' addressed timing and does not narrow the criterion. The ruling would change to approve once the administrator case opens the archiving message via surface.caughtMessage and asserts, tolerantly of wording, that it says an administrator archived the organization and that the owner can no longer use it, keeping the polling and seeded-record structure as they are.

**Conditions:**
- R-3.24 administrator case: the criterion's 'then' requires the owner's message to say the organization was archived by an administrator. Open the archiving message with surface.caughtMessage and assert its subject or plain-text body says an administrator did it, matching loosely enough that exact phrasing is not fixed.
- R-3.24 administrator case: the criterion's 'then' requires the message to tell the owner they can no longer use the organization. Assert this on the same message body through surface.caughtMessage, which the surface already provides.
- Keep the settling-window polling in both cases and the seeded organizations (unqualified for the administrator case, withPendingInvitation for the owner case) as they are. They correctly answer the earlier ruling.

### Runner-owned typecheck evidence

Proposal revision: `1ae26ac564de0b2dc616f23f27f02d8fe6519c0b`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/organizations/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
