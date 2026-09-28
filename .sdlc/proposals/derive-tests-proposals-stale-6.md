---
gate: G3
question: "Do these tests follow from the proposals criteria and from nothing else?"
recommendation: "I rewrote one test for the one criterion listed, R-2.29 (v1)."
opened: 2026-09-28T16:13:40.373Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the proposals criteria and from nothing else?

**Recommendation.** I rewrote one test for the one criterion listed, R-2.29 (v1).

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I rewrote one test for the one criterion listed, R-2.29 (v1). The new file is `tests/acceptance/proposals/R-2.29.spec.ts`. I could not type-check or run it: both the TypeScript compiler and Playwright needed an approval that nobody was there to give. It has been checked by reading only, including every surface method it calls against `tests/generated/surface.d.ts`.

**What the ruling changed.** The earlier version decided whether a proposal was carried by searching its history for the words "code challenge" or "challenge". The new test does not look for any particular wording:
- **Before and after.** It reads every proposal's history before the administrator finalises the agreed scores, and again afterwards. It then works out what finalising added to each history. Dates and times are reduced to their shape, so the same kind of entry reads the same on different proposals.
- **Carried proposals.** Every proposal that should be carried must record something new. They must also all share at least one new entry that no left-behind proposal gained. That shared entry is the move into the next stage, whatever it is called.
- **Left-behind proposals.** None of them may carry that entry.
- **Silent history.** If finalising adds nothing to the history of the proposals that should be carried, the test fails rather than passing.

**The two tests.** There is one test per program, both titled with the criterion's statement. Each uses the program's own seeded opportunity at consensus: `seed.opportunities.swuConsensusSixProponents` and `seed.opportunities.twuConsensusFiveProponents`.
- **Sprint With Us:** the four highest must be carried. The fifth-ranked proposal (12) and the one below a question's minimum (17) must be left behind.
- **Team With Us:** the three highest must be carried. The fourth-ranked proposal (14) and the one below the minimum (17) must be left behind.

The proposal below the minimum outscores two proposals that are carried. So its being left behind shows the minimum working, not its rank, while the proposal just under the cut shows the rank working. The test asserts nothing about what the next stage is called, or about any screen or step beyond finalising and reading history.

**Nothing marked not testable.** I added nothing to `not-testable.yaml`. Every clause is reached through `evaluationConsensusListSwu`/`evaluationConsensusListTwu` (`finalizeConsensusScores`, `confirmFinalizeConsensus`) and `proposalSwuView`/`proposalTwuView` (`historyTab`). I needed no surface action or observation that was missing.

**One assumption the contract doesn't state.** The test assumes `historyTab()` returns one history entry per line, so that different proposals' entries can be compared line by line. A status observation on the reviewer's proposal view would be a steadier signal than history text. The contract could add one to both proposal view pages, but the test does not need it.

I changed nothing outside `tests/acceptance/proposals/R-2.29.spec.ts`. The open redo item for R-2.29 in `tests/acceptance/redo.yaml` is left for the runner to close.
