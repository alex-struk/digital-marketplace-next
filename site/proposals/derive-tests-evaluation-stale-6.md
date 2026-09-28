| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-28T05:42:24.277Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.282 (Claude Code)) |

# Do these tests follow from the evaluation criteria and from nothing else?

**Recommendation.** I rewrote both evaluation tests the ruling sent back, R-5.17 and R-5.21, and added one entry to `tests/acceptance/not-testable.yaml` for a part of R-5.21 that no test can reach yet.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I rewrote both evaluation tests the ruling sent back, R-5.17 and R-5.21, and added one entry to `tests/acceptance/not-testable.yaml` for a part of R-5.21 that no test can reach yet. Nothing was run. This workspace has no application and no TypeScript compiler, so neither file has been type-checked or tried against a target. I also could not run a YAML parser on the new entry; I checked its indentation and quoting by eye against the entries already in the file.

**R-5.17: only people newly added to a panel are notified, and only once the opportunity has left draft.** There are two tests, each building its own Sprint With Us opportunity under a title no other record has. One is published and one is left as a draft. Each then confirms the panel names exactly `seed.users.staffOne` and `seed.users.staffPanelEvaluator`. Next it empties the mail catcher and reads it back through `caughtMessageList.messageCount()`. It goes on only after the count reads zero twice, two seconds apart. It retries up to five times and fails with the last count if the catcher never stays empty. This check also shows the catcher is reachable before any absence is asserted. Only then is `seed.users.staffTwo` added. From that point a caught message counts only if its subject, plain-text body or HTML body contains this opportunity's title. It counts for a person if their address is among the visible recipients or the blind copies. The same count is made for the person added and for the two already on the panel:
- **Published case:** the added person must get at least one message about the opportunity, and each of the other two must get none.
- **Draft case:** all three must get none.

This fixes both faults the ruling named. The old test did not confirm the catcher was empty, and it counted every message sent in that window. The draft test covers the criterion's "only once the opportunity has left draft" part, which the criterion states as a note rather than as its then.

**R-5.21: only an evaluator on the panel may record an individual evaluation, and only while the opportunity is in individual question evaluation.** There are three tests: the chair who is not an evaluator, the owner who is not on the panel, and an evaluator. Each first waits until the opportunity's own page reads as in individual question evaluation, following the bounded closing procedure in `observables.yaml`. A test fails with the last status read if that does not happen within thirty seconds. The test no longer asks for a refusal notice. A refusal is now either of two things:
- the scoring form withholds a step (an action on it fails), or
- the attempt completes, and the evaluation stored under that person's account then has no status and does not hold the score entered.

The contrast is the evaluator. Their attempt must go through, and afterwards the evaluation stored under their account must show a status and hold the score they entered.

One weakness: for the chair and the owner, their stored evaluation is read while signed in as them. If the service simply refuses them that read, the test cannot tell a refused read from an evaluation that does not exist. Either way it counts as "no evaluation by that person exists".

**What could not be tested.** No criterion was wholly untestable. One clause of R-5.21 is not asserted and has its own entry, owned by `contract`: *"only while the opportunity is in individual question evaluation"*. The reason starts with `blocked:`. The seed has no Sprint With Us opportunity outside that stage where an evaluator could still try to record a new evaluation:
- Every seeded opportunity past that stage already has every individual evaluation submitted, so a refusal there would only show a duplicate being refused.
- The only ones before that stage with submitted proposals are the lapsed ones, and the request made by opening the scoring form closes them into individual evaluation.

To unblock it, the seed needs one of these:
- an opportunity at consensus or later with a submitted proposal that one of its evaluators, reachable by a persona, has not evaluated; or
- a published opportunity whose deadline has not yet passed, with a submitted proposal and an evaluator on its panel.

I could not tell whether the service can reach the first of those states at all; if it cannot, the clause is unobservable rather than blocked.

**Surface additions that would help.** None are strictly required. Both tests work around two gaps:
- **A way to read whether an evaluation exists for a given person, even one the reader may not open.** Deciding "no evaluation by that person exists" from their own read of it is weaker than it should be.
- **A catcher observation that finds messages about a named opportunity.** Today every caught message has to be opened one at a time to check for the title.

Nothing outside `tests/acceptance` was changed.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

The question is whether the rewritten R-5.17 and R-5.21 tests and the new not-testable entry follow from their criteria and nothing else. Approved. R-5.17's published-case test asserts its given/when/then exactly (a panel of two is established, a third is added, the added person is reached, the two already on it are not). Its draft-case test covers the clause 'only once the opportunity has left draft', which sits outside the given/when/then. Both faults the earlier return named are fixed: the catcher is emptied and read back as empty before counting, which also shows it is reachable before any absence is asserted, and only messages about this opportunity, identified by its title as that ruling asked, are counted. R-5.21 first establishes the given through the bounded closing procedure in observables.yaml. It no longer requires a refusal notice the criterion never promised: a refusal is a form that withholds a step, or no evaluation by that person existing afterwards, and the evaluator's stored score is the contrast. The weakness that a refused read cannot be told from an absent evaluation is a limit of the surface, is acknowledged, and adds no assertion. The clause 'only while the opportunity is in individual question evaluation' carries a clause-scoped not-testable entry owned by contract, with a real reason that names the seeded records that are missing, and it already shows as an owed missing test. No selectors, routes, status codes or storage names leak in, and nothing outside tests/acceptance changed beyond pipeline bookkeeping. The runner's typecheck reports no diagnostics under acceptance/evaluation/; its failure is two diagnostics in adapters/new/, which this proposal does not touch. This would change if a typecheck error appeared in either evaluation spec, or if evidence showed a panel-addition notice does not carry the opportunity's title, which would make the title filter an assertion the criterion does not make.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `d2c6965f770f58b16360c38fcbf00664b41e7396`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/evaluation/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
