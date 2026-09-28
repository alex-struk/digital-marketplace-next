| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-28T16:19:55.233Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.282 (Claude Code)) |

# Do the revised evaluation tests now follow from their criteria and from nothing else?

**Recommendation.** I made the two changes the reviewer asked for in `tests/acceptance/evaluation/R-5.29.spec.ts`, and nothing else.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I made the two changes the reviewer asked for in `tests/acceptance/evaluation/R-5.29.spec.ts`, and nothing else. I could not run the typecheck this time: the environment asked for approval to run `tsc`, and nobody was there to give it. I read the edited file instead. The new code uses only the page actions and helpers the file already used, so I expect no new errors, but that has not been checked by running it.

**Condition 1: the chair's side of "only the chair may record".** In the evaluator test, the chair now records a consensus for the proponent still waiting for one (`swuOutstandingThree`). It uses the same create screen as the refused attempts: it enters a score and a note for each question, then saves a draft. A failure here is no longer caught and ignored: I split out a new `recordConsensus` helper that lets any failure end the test. The existing `attemptConsensus` helper, which the three refusal attempts still use, now calls it and keeps its own catch. The test then reads the chair's consensus for that proponent back, retrying up to the usual 15 seconds, and requires it to be non-empty. So if the screen does nothing or cannot be used, this test now fails instead of passing. I also extended the test title to say the chair records it.

**Condition 2: check under the chair's id as well.** After the evaluator's attempt, and before the chair records, the test now requires the outstanding proponent to show no consensus under the chair's user id as well as the evaluator's. An evaluator attempt that the application wrongly saved as that proponent's consensus under the chair can no longer pass unseen. The seed leaves this proponent's consensus not begun, so this check holds at the start.

**Condition 3: no change.** The reviewer marked this as a note only. The duplicate-consensus test's count of proponent names on the list is weak if the proponent-row read returns only one row. The missing contract definition of that read is already carried by the existing R-5.29 entry in `not-testable.yaml`.

- **Comments and header:** I rewrote the file's comment about the evaluator test to describe both new checks. The header's "derived" date stays 2026-09-28, which is both the original derivation date and today, since the file's content did change.
- **Untouched:**
  - The duplicate-consensus test and the before-consensus test.
  - Every other file under `tests/acceptance/evaluation/`.
  - `tests/acceptance/not-testable.yaml`. The R-5.29 entry still covers the clauses no test can reach. One is a non-chair changing the chair's consensus. The other is the chair changing a consensus once the opportunity has moved past consensus. Both are blocked because no observation returns the agreed scores or notes, so a refused change looks the same as an accepted one.

No surface action or observation was missing for these changes, and nothing asked me to touch paths outside this stage.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

The question is whether the revised R-5.29 tests follow from their criterion and from nothing else. Approved. In the evaluator test, the chair now records the outstanding proponent's consensus through recordConsensus, which lets any failure end the test, then polls the chair's consensus for that proponent and requires it to be non-empty. So the refusals in the file are measured against a write shown to succeed, which settles #1. Before the chair records, the outstanding proponent is checked for no consensus under both the evaluator's and the chair's user ids, which settles #2. #3 was a note with no change asked; the missing proponent_row definition is carried by the R-5.29 not-testable entry, owned by contract. Every assertion traces to a clause of the criterion: the evaluator is refused while the chair may record, a second consensus is refused as a duplicate, and nothing is recorded before consensus. The not-testable entry gives a real reason and names both clauses no test reaches: a non-chair changing the chair's consensus, and a change after consensus. The runner's typecheck reported no diagnostics under acceptance/evaluation/; the two it reported are in adapters/new/, outside this proposal. The ruling would change if an evaluation-scoped typecheck error or a seed mismatch with the stated given surfaced. The before-consensus test reads an empty status as a refusal with no success check on that opportunity, a weakness I accept because the first test shows the same consensus screen recording and reading back successfully.

**Conditions:**
- condition-met derive-tests-evaluation-stale-8#1: tests/acceptance/evaluation/R-5.29.spec.ts evaluator test — after the evaluator's attempt, the chair calls recordConsensus (no catch) for swuOutstandingThree, then expect.poll(consensusStatusOf(chair, outstanding)).toBeTruthy()
- condition-met derive-tests-evaluation-stale-8#2: tests/acceptance/evaluation/R-5.29.spec.ts evaluator test — before the chair records, consensusStatusOf for the outstanding proponent is asserted to be empty under both the evaluator's and the chair's user ids
- condition-withdrawn derive-tests-evaluation-stale-8#3: it was a note that asked for no change; the missing proponent_row definition is carried by the R-5.29 not-testable.yaml entry owned by contract

### Runner-owned typecheck evidence

Proposal revision: `62e971b5911cd23d651494f02f08aa756e416401`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/evaluation/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
