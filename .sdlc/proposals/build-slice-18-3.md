---
gate: G3
question: "Does slice 18 (The chair agrees a consensus and the questions stage is finalised) do what its criteria say?"
recommendation: "I fixed the one failure that was the application's fault, R-6.15."
opened: 2026-10-04T14:24:14.503Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does slice 18 (The chair agrees a consensus and the questions stage is finalised) do what its criteria say?

**Recommendation.** I fixed the one failure that was the application's fault, R-6.15.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I fixed the one failure that was the application's fault, R-6.15. Every notice to a named group of staff now goes as one message visibly addressed only to the service's own address, with the readers as blind copies. `npm --prefix app run check` passes: typecheck plus 16, 805 and 494 unit tests across the three packages. Nothing has been run against the sandbox or the acceptance suite, so whether verify now passes is untested.

**What was wrong.** The failing test followed the owner's notice from the Team With Us consensus tab. It found the owner as a visible recipient beside the service address, and no blind copies at all. The cause was a choice made in an earlier revision and written up in decision record 0063: each reader got their own copy, visibly addressed to them and the service. The criterion requires the group to travel as blind copies, so that choice could not stand.

**What changed.**
- **The notice helper.** I removed the per-reader helper (`addressedToEach`) and the mailer's option that put a reader beside the service address. A new helper, `blindCopiedToStaff` in `app/backend/src/mail/message.ts`, drops recipients with no address and tells anyone named twice only once. It hands the rest to the existing blind-copy batching at the configured batch size (50 unless set otherwise).
- **The notices that use it.** Five notices now go through it:
  - the panel being told at the proposal deadline;
  - the chair and owner being told the opportunity is ready for consensus;
  - the owner and administrators being told a consensus was submitted;
  - the chair and owner being told it was finalised;
  - the administrators being told a proposal was withdrawn.
- **The withdrawing vendor** still gets a message of their own, visibly addressed to them, because that notice goes to one person.

**Tests.** The helper's unit tests now cover the blind-copy shape, dropping missing and repeated addresses, splitting into batches, and sending nothing when nobody has an address. A mailer test checks that a chair-and-owner notice is addressed only to the service, with both readers as blind copies. I rewrote the five end-to-end tests that expected one copy per reader: the deadline panel notice, the withdrawal, ready-for-consensus, consensus submitted and consensus finalised. Each now checks for one message whose recipients include the readers, whose visible "To" line is the service's address alone, and whose headers name none of the readers.

**Records and comments.** I rewrote the staff-notice section of decision record 0063 to describe the new form, and removed its note that this one-copy-per-reader shape departed from R-6.15. Decision record 0060 described the same arrangement for the panel at the deadline, so I added a line saying 0063 replaces it. I also corrected the outdated comments in the evaluation, consensus and closing code and the paragraph in `app/README.md`.

**Not mine to do.** The R-5.10 failure was filed to the adapter stage, and I left it alone. The application already shows the correct refusals ("…screened into the Code Challenge." for Sprint With Us, "…the Challenge." for Team With Us). The adapter's confirm step (`confirmFinalizeConsensus`) throws when that refusal appears, so the test never reaches the step that reads it. That stage has to change the adapter so confirming completes on a refusal and the refusal text is returned.

**One risk for the next verify.** Readers now appear only as blind copies, never as visible recipients. Any test step that finds a staff member's message by its visible recipient will no longer find it. The failed run read the blind copies (empty) before the visible line, which suggests the mail fixture can see blind copies, but I could not confirm that here.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

The question is whether slice 18 does what its criteria say, after three failed verifies left R-5.31 and R-5.33 failing. I return it, and the reason is the tests, not the application. The build carried out what the last ruling asked: every staff notice now goes as one message visibly addressed only to the service, with the readers as blind copies (blindCopiedToStaff in app/backend/src/mail/message.ts; decision record 0063 rewritten), and R-6.15 passed in this same verify run. R-5.31 and R-5.33 fail because both tests look for the notice with mail.messagesTo(reader), and that function is a Mailpit search on the visible To line only (tests/fixtures/mail.ts:17). Their header comments say they rely on spec/contract/observables.yaml:152, which says a message is 'addressed to one person and every other recipient is a blind copy'. That contradicts R-6.15, which makes the service's own address the only visible recipient. Once the application obeys R-6.15, no reader's address is ever on the To line and both tests time out at zero. The criteria only ask that the owner and administrators (R-5.31), and the chair and owner (R-5.33), are notified; neither asks for any of them to be a visible recipient. Another build cannot pass these tests without breaking R-6.15, which is the case the escalation was about, so the work goes to the stages that wrote the tests and the contract. What would change the ruling: R-5.31 and R-5.33 tests that find the notice through its blind-copy list, and a contract note that matches R-6.15. After that, a verify where all fifteen criteria pass makes this approvable as it stands.

**Conditions:**
- condition-met build-slice-18-2#3: addressedToEach and the mailer's per-reader visible recipient are removed; the panel, ready-for-consensus, consensus-submitted, consensus-finalised and withdrawal-to-administrators notices go through blindCopiedToStaff (app/backend/src/mail/message.ts), visibly addressed to the service with the readers as blind copies; decision record 0063 no longer records the one-copy-per-reader departure and 0060 points to it.
- condition-met build-slice-18-2#2: R-6.15 passes in the verify of build-slice-18-3 against application tree 1520f67 (tests/results/new/slice-18.json); the owner's notice from the Team With Us consensus tab now carries the readers as blind copies with only the service visible.
- test-overreaches R-5.31: the test only counts a notice it finds through mail.messagesTo(owner or administrator), a Mailpit search on the visible To line, so it requires one of the readers to be a visible recipient. R-5.31 asks only that the owner and every administrator are notified, and R-6.15 requires the visible recipient of a multi-recipient notice to be the service's own address alone. Find the submitted-consensus notice another way (for example by subject, or by the service address) and assert the owner and both administrators from its blind-copy list (caughtMessage.copiedRecipients after opening it by id).
- test-overreaches R-5.33: the test only counts a notice it finds through mail.messagesTo(chair or owner), a Mailpit search on the visible To line, so it requires the chair or the owner to be a visible recipient. R-5.33 asks only that the chair and the owner are notified, and R-6.15 requires the visible recipient to be the service's own address alone. Find the finalised-consensus notice another way and assert the chair and the owner from its blind-copy list (caughtMessage.copiedRecipients after opening it by id).
- addressed-to contract: spec/contract/observables.yaml, mail notes (lines 152-154), says 'A message is addressed to one person and every other recipient is a blind copy'. R-6.15 requires a multi-recipient notice to show the service's own address as its only visible recipient and carry every reader as a blind copy. The R-5.31 and R-5.33 tests cite this note as the reason they search by visible recipient, and they fail against an application that meets R-6.15 (verify of build-slice-18-3, slice 18). Restate the note so it agrees with R-6.15, and say that to find who a multi-recipient notice reached you open it and read its blind-copy list, because searching by a reader's address finds nothing.
