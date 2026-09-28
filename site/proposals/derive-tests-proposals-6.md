| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-28T05:25:19.497Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.282 (Claude Code)) |

# Do the revised proposals tests now follow from their criteria and from nothing else?

**Recommendation.** I made the one change the returned ruling asked for in `tests/acceptance/proposals/R-2.33.spec.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I made the one change the returned ruling asked for in `tests/acceptance/proposals/R-2.33.spec.ts`. I couldn't re-run the typecheck afterwards, because running the TypeScript compiler here needs an approval nobody was present to give.

**Condition 1 (R-2.33):** In the first test I removed the assertion that `opportunityCwuView.successfulProponent()` contains `seed.organizations.qualified.legal_name`. The test now checks that the opportunity was awarded in one way only: after `awardProposal()`, the opportunity's status must change from what it read just before the award. That is the check the ruling asked to keep, and it was already there. I also reworded the file's opening comment, which described the award as naming the organization as the successful proponent. It now says only that the opportunity's status changes from what it was before the award. Nothing else in the file changed:
- the awarded proposal's status still has to change;
- the disqualified and withdrawn proposals still have to read the same after the award as before it;
- the second test is untouched.

`seed` is still imported, because both tests use it to name the opportunities and proposals, so the edit leaves no unused import.

**Things to check:**
- **Unverified typecheck:** the removed lines were a single self-contained statement, so I don't expect the change to break compilation. It is still unconfirmed, so the next stage should re-run the typecheck.
- **Header date:** I left the header lines as they were. The "derived" date reads 2026-09-28, one day after today's date in this session. No new header was supplied, so I did not change the date to an earlier day on my own; it should be looked at when the file is ruled on.

No other file in `tests/acceptance/proposals/` changed, and `tests/acceptance/not-testable.yaml` is untouched: this condition needed no new entry, and the existing R-2.27 draft-clause entry stays as it was. No surface action or observation was missing for this fix, so there is nothing new for the contract stage to add. I acted on the only condition, and nothing asked me to change a path outside this stage's boundary.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

Question: do the revised proposals tests now follow from their criteria and from nothing else? Ruling: approve. The only instruction the earlier ruling left owed (derive-tests-proposals-stale-4#1) is carried out. R-2.33.spec.ts no longer calls opportunityCwuView.successfulProponent() or reads any organization's name. The opportunity counts as awarded because its status, read after awardProposal(), differs from the status read just before it. That matches the criterion's 'the opportunity becomes awarded' without adding a proponent or a name it never mentions. The rest of R-2.33 still follows its criterion: the awarded proposal's status as its own vendor reads it changes; the disqualified proposal's vendor-read status and the withdrawn proposal's history read the same after the award as before it; the second test covers 'marks every other proposal still in contention as not awarded' by requiring the unchosen proposal's status to change to something different from the chosen one's. R-2.27 and R-2.34 carry the approach the earlier ruling accepted. A state change is read as a status differing from before, never as a particular word appearing. The R-2.27 draft clause has a not-testable entry naming its clause. Its reason is real: no seeded lapsed opportunity carries a draft beside a proposal that can be scored, and a test cannot create an opportunity with a deadline already passed. It is owned by contract, and the ledger already carries it as missing-test/R-2.27. The runner's typecheck reports no diagnostics under acceptance/proposals/. The non-zero exit comes from two diagnostics in adapters/new/, outside this proposal. The 2026-09-28 'derived' date matches the proposal's opened timestamp (2026-09-28T05:25Z) and is not a defect. This ruling would change if the typecheck reported errors in the proposals specs, or if a test were shown to rely on an observation its criterion does not name.

**Conditions:**
- condition-met derive-tests-proposals-stale-4#1: the successfulProponent()/seed.organizations.qualified.legal_name assertion is removed from the first test in tests/acceptance/proposals/R-2.33.spec.ts; the opportunity-awarded check is now `expect.poll(() => opportunityStatus(surface, opportunityId), settle).not.toBe(beforeAward)` after awardProposal(), and the file's opening comment no longer describes a named successful proponent

### Runner-owned typecheck evidence

Proposal revision: `40b9846267f613269f71c15827344db22d9573fd`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/proposals/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
