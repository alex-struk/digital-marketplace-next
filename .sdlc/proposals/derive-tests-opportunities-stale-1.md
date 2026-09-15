---
gate: G3
question: "Do these tests follow from the opportunities criteria and from nothing else?"
recommendation: "I rewrote six of the seven opportunities criteria as test files."
opened: 2026-09-15T02:23:44.723Z
---

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** I rewrote six of the seven opportunities criteria as test files.

I rewrote six of the seven opportunities criteria as test files. R-1.35 is now a blocked entry in `not-testable.yaml`, and I deleted its old test file. All six rewrites answer their redo notes. Nothing has been run: this workspace has no target or mail catcher, and `tests/node_modules` is missing, so I couldn't even typecheck. I checked every call by hand against `surface.d.ts`, and none of the new files contains a selector, a locator, a test id or a route string.

**R-1.1.** Three tests: the opportunity moves to its first evaluation stage, its submitted proposals move to review, and its author is notified. Each reading is now repeated until the new state shows, instead of being taken once.
- **Who reads what:** an administrator reads each opportunity's status and its history, which must say "This opportunity has closed." Each proposal is read by the vendor who submitted it.
- **Proposals not checked:** the third proposal on each opportunity isn't read, because no persona signs in as that vendor.
- **Code With Us:** not covered, because the seed has no Code With Us opportunity past its deadline.
- **Author notice:** the test waits for a message to the author whose subject or snippet names the closed opportunity. It checks that the message exists rather than counting mail, because the closure can run before the test starts. The contract notes that the old application's closing notices never arrived, so this test may fail against it. By the contract's own account, that failure would be a real finding.

**R-1.3 and R-1.21.** Before doing anything, both now read the staff member's own permissions statement on their profile and require that it doesn't mention administrator rights.
- **R-1.3:** the staff member creates a draft and an opportunity under review, then lists opportunities. The administrator's test reads the same list.
- **R-1.21:** the incomplete draft is saved first, then submitted from the page for managing it. It counts as refused if it's still a draft afterwards.

**R-1.8.** Each draft, in all three programs, is now saved with complete content, and the test confirms it was accepted before reading which program it's filed under. After that, the opportunity's details are changed and the program is read again, which is as close to "never changed afterwards" as the surface gets.

**R-1.53.** One test per clause of the rule, each run in all three programs:
- An administrator deletes a draft.
- An administrator deletes one under review.
- The staff member who created it deletes their draft.
- That staff member is refused once it's under review, and the opportunity remains.
- Deleting the three seeded opportunities that have been published is refused, whether the author or an administrator asks.

Every opportunity a test builds is complete, and its state is read before anyone tries to delete it.

**R-1.24.** The test waits for each opportunity to reach an evaluation stage, then waits for all three proponent names to appear on the evaluation list.

**Not testable: R-1.35 (blocked).** The watchers, the proponents and possibly the author are told in one group message, with everyone but the addressee in blind copies. The mail fixture only searches by visible recipient, so being told can't be told apart from not being told. The edit and the addendum themselves are reachable.

**Surface pieces I needed but didn't find:**
- **`opportunity-cwu-edit` (and its Sprint With Us and Team With Us equivalents):** no observation of a refusal message. Because of this, R-1.21's second half is not asserted: that the person is told the opportunity is incomplete, without naming the missing field. The only `field_error` is on the create page, and a draft there hasn't been saved yet. I kept the file because the refusal itself is testable, and the file's comment says what was left out. The fix is something like `incomplete_submission_error` on the edit pages.
- **`mail`:** no way to read one message's To and Bcc. `observables.yaml` already names `read_one_message` and `copied_recipients` (the blind-copy list); the fixture lacks them. A listing of every message would also work. This blocks R-1.35, and it also needs the service's own sending address named in the contract.
- **Seed or personas:** the third proponent has no persona, so its proposal can't be read. The seed also has no Code With Us opportunity past its deadline, which R-1.1 would need to cover that program.
- **`user-profile`:** no plain observation of whether an account holds administrator rights. Reading the permissions statement for the word "admin" is the closest thing available, and it could misjudge an account if that wording differs.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Question: do the rewritten R-1.1, R-1.3, R-1.8, R-1.21, R-1.24 and R-1.53 tests, and the blocked entry for R-1.35, follow from their criteria and from nothing else? Ruling: approve. Each redo note is answered. R-1.1 and R-1.24 now repeat each reading until closure has finished, and each reading is made by someone entitled to see it. R-1.3, R-1.21 and R-1.53 first establish that the staff member holds no administrator rights. R-1.8 and R-1.53 build complete opportunities in all three programs and check that each was accepted before acting on it. R-1.21 submits a saved draft. Every assertion traces to the spec text. 'This opportunity has closed.' and 'Proponent 1/2/3' are quoted from the criteria. The /evaluat|question/ status pattern uses the stage names the spec itself gives ('team questions', 'resource questions'). The author notice in R-1.1 is identified by the opportunity's title, and the criterion's 'notified that it is ready' has to identify which opportunity 'it' is. The seed confirms staffOne wrote both closed opportunities. R-1.53 exercises every clause in all three programs, as the criterion's 'alike' requires. No selector, route, table or status code appears. The two gaps are real, checked against the repo. The Code With Us edit page offers no reading of a message or refusal (surface.d.ts:165), so R-1.21 cannot observe what the person is told. The mail fixture offers only messagesTo, and observables.yaml says group messages go to one visible recipient with the rest as blind copies, so R-1.35 is genuinely blocked. The runner's typecheck passed with no diagnostics for this proposal's files. The check warnings concern other domains, no adapter or application file changed, and the tier is STANDARD, so nothing requires escalation. What would change the ruling: a calibration failure showing a test asserts something the criterion does not say, such as a closure notice that correctly omits the opportunity's title; or the surface gaining an incomplete-submission message on the edit pages, or a way to read a message's blind copies. Either of those would bring R-1.21's message half, or R-1.35, back for derivation rather than leaving them excused.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `2a9b8bd2b087340881be6be1bf21f36d840d04c1`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    No diagnostics.
