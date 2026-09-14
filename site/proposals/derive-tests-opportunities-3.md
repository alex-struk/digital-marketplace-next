| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-11T10:09:41.197Z |
| holder | agent:reviewer |

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** Forty of the fifty criteria now carry a test; ten are recorded as not testable.

Forty of the fifty criteria now carry a test; ten are recorded as not testable. I rewrote the whole domain rather than adding to it, because the thirty-six files already present were derived against an earlier contract and call page `open` with an `id` or a `title`, which the current generated types reject.

| outcome | count |
|---|---|
| criteria with a spec file | 40 |
| criteria in not-testable.yaml | 10 |

The contract has grown since the previous derivation, and four criteria the earlier run gave up on are now reachable. It carries a scheduled transition trigger that performs a closure on demand, a seed holding one Sprint With Us and one Team With Us opportunity published with a deadline already thirty days gone, a published-date observation on all three opportunity views, and observations naming who created and who last changed an opportunity. Those four gave tests for the automatic closure, the recorded publication date, the anonymous proponent names written at closure, and the withholding of the creator's and changer's names.

That matters beyond this domain. Roughly forty not-testable entries in other domains justify themselves with the phrase "see R-1.1", meaning no closure can be brought about. That premise is false now. Those entries are not mine to edit, and I left them alone, but every one of them deserves re-deriving.

What remains out of reach is all seed-shaped rather than surface-shaped. Each program has exactly one closable opportunity, the seed is applied once before the run, and nothing resets it. Reaching a stage past the first evaluation one means walking that single record through every stage in between, after which no other test could find it where it needed it. The ten blocked criteria are the ones whose given is a consensus stage, a code challenge stage, a final evaluation stage, processing, awarded, or a completed report. The remedy is seeded opportunities already sitting at each of those stages. I named the specific starting state each one needs in its reason.

Surface additions I looked for and did not find:

- **An action that watches an opportunity without toggling**, plus an observation of the duplicate-watch refusal. Only a toggle exists, so asking twice unwatches rather than asking again, and the third clause of the watching criterion goes unasserted.
- **An observation of an opportunity's completion date.** The draft-date rule says the completion date is left empty, and no view returns it.
- **An observation naming a second chair on an evaluation panel.** Four panel errors exist; none distinguishes a refusal for two chairs from any other refusal.
- **An observation of the successful proponent's contact details**, which one criterion says are withheld from readers who may not see the score.
- **An observation of the state changes an opportunity's program permits**, needed for the claim that the recorded transitions and the award path agree.
- **An observation of what a note in an opportunity's history carries.** A note with an attached file cannot be told from one without.
- **An observation of an earlier version of an opportunity.** Retention of previous content is asserted only indirectly, as the history text having grown.

The blind-copy list and message body remain unreadable through the mail fixture, so the group notifications on publication, change, cancellation and addendum are asserted for the author alone.

I could not run the type check. The suite has no installed dependencies in this workspace. I verified every page, action and observation name against the generated surface by hand, confirmed every `open` call passes the parameter shape the types declare, and confirmed no file trips the separation check.

## Ruling

**Verdict:** return
**By:** agent:reviewer

Do these tests follow from the opportunities criteria and from nothing else? Returned. The not-testable reasons are real and name what is missing, no implementation details leak into the tests, and the typecheck failures are all in other domains, but three tests assert something their criterion does not support. (1) R-1.1's notification test counts the author's mail before calling the closure trigger and expects it to grow. The criterion and the seed manifest both say closure runs in front of any /api or /status request, and the suite runs serially (workers: 1) with content/, evaluation/, files/ and notifications/ ahead of opportunities/. The one-time notice has therefore already been sent before the count is taken, so the test fails against a conforming system, as its own comment concedes. (2) R-1.18 reads a field error straight after adding a resource to an unsaved form. The criterion's given and when are the submission of a Team With Us opportunity that is not a draft, so the test asserts rejection at add time, which the criterion never states. (3) R-1.37 asserts that a visibly addressed notice reaches the administrator and concedes in its comment that a blind-copied notice would fail it. Addressing is not in the criterion, and R-1.34 to R-1.36 decline the same assertion for the same fixture limitation. The ruling changes to approve once those three are corrected.

**Conditions:**
- R-1.1: remove the before/after mail-count test; state in the file comment that the author notification is not asserted because closure is one-shot and triggered by any /api or /status request, so the moment of notification cannot be isolated. Keep the status and proposal-review tests.
- R-1.18: have each case submit an otherwise complete Team With Us opportunity that is not a draft (as R-1.13 and R-1.16 do) and read the rejection after that submission, not after addResource alone.
- R-1.37: drop the every-administrator mail assertion or mark it unassertable on the same blind-copy grounds used in R-1.34 to R-1.36; keep the author-confirmation test.
- Non-blocking: R-1.1, R-1.19 and R-1.24 read the seeded closed opportunities at their first evaluation stage; this holds only while no earlier-running domain advances those records, which should be rechecked when the evaluation domain is re-derived against the same seeds.

### Runner-owned typecheck evidence

Proposal revision: `d6e2b8c84d35f5117ad845eaa11f60b96b58756a`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`

    acceptance/evaluation/R-5.1.spec.ts(25,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.16.spec.ts(74,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.16.spec.ts(82,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.16.spec.ts(95,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.16.spec.ts(101,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.16.spec.ts(114,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.16.spec.ts(120,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.17.spec.ts(75,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.17.spec.ts(99,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.18.spec.ts(53,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.18.spec.ts(89,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.18.spec.ts(101,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.18.spec.ts(113,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.18.spec.ts(121,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.18.spec.ts(135,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.18.spec.ts(147,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.19.spec.ts(20,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.19.spec.ts(36,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.9.spec.ts(26,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/files/R-8.1.spec.ts(17,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/files/R-8.12.spec.ts(17,37): error TS2353: Object literal may only specify known properties, and 'file' does not exist in type '{ fileId: string; }'.
    acceptance/files/R-8.12.spec.ts(27,37): error TS2353: Object literal may only specify known properties, and 'file' does not exist in type '{ fileId: string; }'.
    acceptance/files/R-8.14.spec.ts(18,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
    acceptance/files/R-8.20.spec.ts(23,5): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ program: string; opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/files/R-8.20.spec.ts(31,43): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/files/R-8.21.spec.ts(19,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
    acceptance/files/R-8.25.spec.ts(36,5): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ program: string; opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/files/R-8.25.spec.ts(41,43): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/files/R-8.28.spec.ts(11,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
    acceptance/files/R-8.28.spec.ts(18,38): error TS2554: Expected 0 arguments, but got 1.
    acceptance/files/R-8.28.spec.ts(24,41): error TS2353: Object literal may only specify known properties, and 'organization' does not exist in type '{ orgId: string; }'.
    acceptance/files/R-8.30.spec.ts(14,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
    acceptance/notifications/R-6.10.spec.ts(19,41): error TS2353: Object literal may only specify known properties, and 'organization' does not exist in type '{ orgId: string; }'.
    acceptance/notifications/R-6.17.spec.ts(29,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/notifications/R-6.17.spec.ts(34,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/notifications/R-6.17.spec.ts(37,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
    acceptance/notifications/R-6.17.spec.ts(43,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/notifications/R-6.21.spec.ts(23,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.21.spec.ts(30,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.22.spec.ts(16,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.23.spec.ts(32,34): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.7.spec.ts(14,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.7.spec.ts(20,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.7.spec.ts(29,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.7.spec.ts(34,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/proposals/R-2.1.spec.ts(54,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/proposals/R-2.1.spec.ts(67,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.1.spec.ts(72,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.1.spec.ts(76,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.10.spec.ts(72,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.10.spec.ts(103,40): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; proposalId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.10.spec.ts(121,40): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; proposalId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.10.spec.ts(125,40): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; proposalId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.11.spec.ts(69,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.11.spec.ts(106,40): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; proposalId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.12.spec.ts(48,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.12.spec.ts(53,40): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; proposalId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.13.spec.ts(45,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.13.spec.ts(100,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.14.spec.ts(77,44): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.14.spec.ts(90,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.14.spec.ts(102,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.14.spec.ts(123,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.14.spec.ts(134,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.14.spec.ts(145,40): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; proposalId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.16.spec.ts(103,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.16.spec.ts(144,40): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; proposalId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.16.spec.ts(147,40): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; proposalId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.16.spec.ts(152,40): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; proposalId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.16.spec.ts(155,40): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; proposalId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.16.spec.ts(164,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.17.spec.ts(85,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.17.spec.ts(134,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.18.spec.ts(139,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.18.spec.ts(167,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.18.spec.ts(199,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.18.spec.ts(218,40): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; proposalId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.19.spec.ts(93,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.2.spec.ts(50,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.2.spec.ts(56,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.2.spec.ts(66,40): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; proposalId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.20.spec.ts(60,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.21.spec.ts(67,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.22.spec.ts(108,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.22.spec.ts(133,40): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; proposalId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.22.spec.ts(139,40): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; proposalId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.22.spec.ts(154,40): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; proposalId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.22.spec.ts(160,40): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; proposalId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.23.spec.ts(44,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.23.spec.ts(58,40): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; proposalId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.23.spec.ts(63,40): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; proposalId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.23.spec.ts(74,40): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; proposalId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.23.spec.ts(78,40): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in 
    [diagnostics truncated]
