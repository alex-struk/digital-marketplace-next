| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T16:01:56.533Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Do these tests follow from the evaluation criteria and from nothing else?

**Recommendation.** I added a test for R-5.27 (v2), the one criterion in this run, using the opportunity the contract stage seeded for it.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I added a test for R-5.27 (v2), the one criterion in this run, using the opportunity the contract stage seeded for it. One clause of the criterion still has no test, so I recorded that clause in `tests/acceptance/not-testable.yaml`. I couldn't compile or run anything: `tests/node_modules` is not installed here, so the type check never ran and the tests have never been executed.

**What was already there.** `tests/acceptance/evaluation/R-5.27.spec.ts` already existed from the last approved derivation, and `not-testable.yaml` had no entry for R-5.27. I kept its two tests:
- **Two evaluators, three proponents, four questions** (`opportunities.closedSprintWithUs`): both evaluators score and submit, the status on `opportunity-swu-view` reaches consensus, and the chair (`users.administratorOne`) and the owner (`users.staffOne`) are both found among the recipients of a caught message. That message is found through `caught-message-list` and the service's own address, and a person counts as told whether they are a visible recipient or a blind copy.
- **Changing the panel during individual evaluation** (`opportunities.closedTeamWithUs`): the owner seats `users.staffPanelEvaluator` through `evaluation-panel-twu`, the two original evaluators submit, and the opportunity does not reach consensus.

**What I added.** A third test on `opportunities.swuNewestVersionSeatsThirdEvaluator`, the opportunity the contract stage seeded for this criterion. Its newest version seats `users.staffPanelEvaluator` as a third evaluator whose scores are already submitted.
- Signed in as public-sector-staff, the test scores all three proponents and submits on `evaluation-individual-list-swu`. It checks that the submission was accepted: no incomplete-evaluation error, and the evaluation status changes.
- It then reads the status on `opportunity-swu-view` and asserts it is not consensus. That count, 24 of 36, is everything the first version would have needed.
- Signed in as administrator, it scores the proponents, empties the mail catcher, and submits. It then waits for the status to reach consensus and for the chair and the owner to be told, read the same way as in the first test.

This test shows the move happening only when the newest version's count is reached, which the older Team With Us test could only show from the side that stays put. To support it, the scoring helper now takes the opportunity and its proposals as parameters, defaulting to what it used before. I didn't use the `evaluation-panel-third-evaluator` persona, because it is marked unavailable on the oracle.

**The clause with no test:** "but only over the proponents named in the submission that triggers the check." I wrote a `blocked:` entry beside the test, owned by `contract`.
- The only submission the surface offers, `submit_scores_for_consensus`, names every proponent at once.
- `submit_this_evaluation_alone` on `evaluation-individual-request-swu` is refused by design (R-5.26).
- With every proponent always named, a count over the named proponents and a count over all of them never differ, so no test can tell them apart.

What would unblock it is a seeded opportunity where the submission that completes the count leaves one proponent out, with every named proponent fully scored and the left-out one not. Alternatively, the contract could state that such a submission can never happen. In that case the clause is unobservable and should go to `ratify`, to be restated or withdrawn.

**Totals:** one criterion with a test, partially covered. No criterion was wholly untestable. The one thing I needed and didn't find is that seeded state, or a submission action that names fewer than every proponent.

**Not mine to change:** the existing R-1.51 entry in `not-testable.yaml` has no `missing` or `owner` field. I left it as it is, since it isn't part of this run.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

The question is whether the R-5.27 (v2) tests follow from the criterion and from nothing else. The two existing tests are unchanged. The new test on opportunities.swuNewestVersionSeatsThirdEvaluator asserts the clause about the most recent version: the opportunity stays out of consensus at 24 submitted scores (the first version's full count) and moves only at the newest version's 36, after which the chair and the owner are found among the message recipients. Every assertion follows from the criterion's text. The accepted-submission check is a precondition that makes the negative meaningful, not an extra claim about the product. No implementation detail leaks in, and the runner's typecheck passed. The clause 'only over the proponents named in the submission that triggers the check' cannot be asserted: the only submission on the surface names every proponent, and solo submission is refused by R-5.26, so the two counts never differ. Its not-testable entry names exactly what is missing and is correctly owned by contract, so it is kept owed rather than returned. The missing test for the newest-version clause remains open until this new test runs, which no ruling can record. The ruling would change if that test fails when run, or if contract supplies a partial-submission seed and no test follows.

**Conditions:**
- missing-test R-5.27: but only over the proponents named in the submission that triggers the check — owed by contract: a seeded opportunity in individual evaluation where the submission that completes the count names fewer than every proponent, with every named proponent fully scored by the newest version's panel and the left-out one not; or a contract note stating such a submission cannot occur, so the clause can be restated or withdrawn at ratify

### Runner-owned typecheck evidence

Proposal revision: `c4f88cea272a383e4f753ba7ef1180465c1f2d60`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/evaluation/`, which this proposal answers for.

    No diagnostics.
