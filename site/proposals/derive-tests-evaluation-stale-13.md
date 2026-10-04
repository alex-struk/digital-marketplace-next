| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T14:32:57.775Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Do these tests follow from the evaluation criteria and from nothing else?

**Recommendation.** I rewrote the tests for both criteria (R-5.31 and R-5.33) in `tests/acceptance/evaluation/`, with the two header lines given at spec@658792c3.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I rewrote the tests for both criteria (R-5.31 and R-5.33) in `tests/acceptance/evaluation/`, with the two header lines given at spec@658792c3. Neither criterion went into `not-testable.yaml`. I could not type-check or run them: this session didn't allow the TypeScript check, and there is no target or mail catcher here.

**What the ruling faulted, and what changed.** Both earlier tests found the notice only by searching for messages addressed visibly to the owner, an administrator or the chair. That can't work when the visible recipient is meant to be the service's own address alone (R-6.15). The new tests don't search by any reader's address.
- **How they find the notice:** they take every message identifier from the full message list, plus a search on the service's own address. They open each message by its identifier and read both its visible recipients and its blind copies.
- **What they count as told:** a person counts when their address is on either of those lists.
- **Why not blind copies alone:** the criterion says only that the people are told, not how they are addressed. Requiring blind copies would also assert R-6.15, which this test is not answerable for.

**R-5.31.** The test takes the seeded closed Team With Us opportunity into consensus: both panel members submit their evaluations, and the chair records agreed scores for all three proponents. It then empties the mail catcher and checks it stays empty for two seconds, so nothing left over from earlier steps is counted. Then the chair submits the consensus. The test passes once the owner and both seeded administrators have each been reached by some message caught after the submission.

**R-5.33.** Same route, with every agreed score at five so that finalising is accepted past the fourth question's minimum. The chair submits, the catcher is emptied and checked the same way, and the consensus is finalised. The test passes once the chair and the owner have each been reached.

**Choices made:**
- The walk through the opportunity is unchanged from the earlier tests; the ruling didn't fault it. I didn't use the seeded opportunities that are already at consensus, because none of them both has its agreed scores still unsubmitted (which R-5.31 needs) and names its owner and panel in the seed (which both tests need).
- Each criterion has one condition and one outcome, so each got one test, titled with the criterion's own statement.
- Neither test checks a subject line. Emptying the catcher right before the action is what ties the messages to it, and the contract gives no subject text to compare against.

**Gaps.** Every page, action and observation I needed exists in the surface, so nothing is owed to the contract. One gap, which these tests work around rather than need closed: the mail helper can only search by visible recipient. Opening a message by its identifier and reading its blind copies is only possible through the surface's caught-message pages. A mail helper call that opens a message and returns its blind copies would be the natural addition, but that file belongs to another stage, so I left it alone.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: do the rewritten R-5.31 and R-5.33 tests follow from their criteria and from nothing else? Approved. The earlier return faulted both tests for finding the notice only by searching for mail addressed visibly to the owner, an administrator or the chair, which cannot work when R-6.15 makes the service's own address the only visible recipient. Both tests now collect every message caught after the action, open each one, and count a person as told when their address is a visible recipient or a blind copy. Each test then asserts exactly its criterion's outcome: R-5.31, that the owner and both administrators are reached after the chair submits the consensus; R-5.33, that the chair and the owner are reached after the consensus is finalised. Neither test asserts how people are addressed, so neither asserts R-6.15, and neither checks subject text the contract does not give. The catcher is emptied and confirmed to stay empty just before the action, which ties the messages to the submission or finalising and covers the 'notified that the consensus has been submitted / finalised' clause. Every name the tests use comes from the contract (seed records, the sender address in observables.yaml, the caught-message pages), so no implementation detail leaked in. There are no not-testable entries to justify, and the runner's typecheck passed on this revision. What would change the ruling: evidence that a test passes on mail the action did not send, meaning the timing tie is not enough and message content would have to be asserted.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `374afac11c69221f156585da3fccfd3147547790`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/evaluation/`, which this proposal answers for.

    No diagnostics.
