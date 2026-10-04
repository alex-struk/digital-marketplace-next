| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T18:22:19.377Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Do these tests follow from the proposals criteria and from nothing else?

**Recommendation.** I rewrote the test for R-2.30 (v1) in `tests/acceptance/proposals/R-2.30.spec.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I rewrote the test for R-2.30 (v1) in `tests/acceptance/proposals/R-2.30.spec.ts`. That is the only criterion in this run, so it is one test and no not-testable entries. I did not type-check or run it: the command to run the type-checker needed approval this session could not get. Every surface member the test uses is declared in `tests/generated/surface.d.ts`.

The ruling said the old test opened the Sprint With Us proposal's printable-copy page (`proposalSwuExportOne`) and failed whenever that page was not served. The new test never opens it. It uses the same seeded starting point:
- **The opportunity:** `seed.opportunities.swuTeamScenarioLastToScoreA`, with two proposals still in contention.
- **The lower bid**, 100,000, already scored on the team scenario with a price score of 100.
- **The higher bid** (`seed.proposals.swuScenarioAHigherBid`), 200,000, waiting for its team scenario score.
- **A third proponent** was left behind at the questions, so it is not in contention.

Signed in as `persona.administrator`, the test enters the higher bid's team scenario score through `proposalSwuView.scoreTeamScenario`, which is the last human-entered score. It then waits until a price score of 50 shows where the administrator sees individual scores, having first checked that 50 was not shown there before. That before-and-after comparison is how it checks "calculated when the last human-entered score is recorded."

The places it reads are:
- the proposal's own page: `proposalSwuView.priceScore` and `teamScenarioTab`;
- the opportunity's page, if it opens: `opportunitySwuEdit.proposalsTab` and `teamScenarioTab`.

The criterion does not say where the score appears, so no single page is required: one that is missing or fails to open adds nothing rather than failing the test. The proposal's own page is the exception, because the scoring action happens there.

The proposal's history is read before and after through `proposalSwuView.historyEntries`, falling back to `historyTab`. Afterwards it must mention the price score more often than before and have one more "evaluated" entry, which covers the "recorded in history" and "fully evaluated" parts of the expected outcome. Every part of the criterion is asserted, so no partial entry was needed and `not-testable.yaml` is unchanged.

Nothing was missing from the surface. One gap worth closing in the contract: `proposalSwuView.priceScore` has no note saying who is shown it or when during evaluation. A test could rely on that one observation alone, instead of searching several tabs, if the contract stated it. I made no changes to the spec, seed, fixtures or config files.

## Ruling

**Verdict:** approve
**By:** runner:checks

Approved by the runner's checks, which policy.gates.G3.auto_approve lets settle derive-tests proposals: the acceptance typecheck of 19632a1e5 is clean; no condition is open against it; no escalation stands on it; no test file was deleted, no changed test asserts less than before and no new test asserts nothing.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `19632a1e5400f62217d238745c1dd8afbf3cc475`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/proposals/`, which this proposal answers for.

    No diagnostics.
