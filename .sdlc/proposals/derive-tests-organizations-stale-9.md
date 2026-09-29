---
gate: G3
question: "Do these tests follow from the organizations criteria and from nothing else?"
recommendation: "I rewrote the test for R-3.24."
opened: 2026-09-29T12:18:43.404Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

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
