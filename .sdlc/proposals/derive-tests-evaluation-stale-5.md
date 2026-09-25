---
gate: G3
question: "Do these tests follow from the evaluation criteria and from nothing else?"
recommendation: "One criterion was owed a test, R-5.34 v2, and it now has one: `tests/acceptance/evaluation/R-5.34.spec.ts`."
opened: 2026-09-25T14:02:33.190Z
---

# Do these tests follow from the evaluation criteria and from nothing else?

**Recommendation.** One criterion was owed a test, R-5.34 v2, and it now has one: `tests/acceptance/evaluation/R-5.34.spec.ts`.

One criterion was owed a test, R-5.34 v2, and it now has one: `tests/acceptance/evaluation/R-5.34.spec.ts`. I removed its entry from `tests/acceptance/not-testable.yaml`, so the criterion now has a test and no entry. No clause was left out, so there is no partial-clause entry. I did not run or type-check the test, because running the TypeScript compiler here needed an approval that wasn't given.

**Why it was blocked.** A contract change was all it needed. The old entry said two things were missing: a separate person standing in each role, and a chair who is neither the owner nor an administrator. The contract answered with seeded opportunities instead of a new sign-in. One public sector sign-in (`persona.publicSectorStaff`) now has a different relationship to each of four opportunities:
- `swuEvaluatorNotOwnerNorChair`: an evaluator only (new).
- `swuLapsedChairNotEvaluator`: the chair only.
- `swuLapsedOwnerOffPanel`: the owner, not on the panel.
- `swuCodeChallengeOfOtherStaff`: no connection at all.

The contract also added `instructions_tab` and `evaluation_tab` to `opportunity-swu-edit` and `opportunity-twu-edit`. With the existing `consensus_tab` and `evaluation_panel_tab`, that gives one observation for each of the four tools the criterion names.

**What the test does.** It has one test per person in the criterion's given/when/then, each titled with the criterion's statement and the outcome for that person. Each test signs in, opens `surface.opportunitySwuEdit` on the matching opportunity, and checks which of the four tabs are offered:
- **Evaluator:** instructions and individual evaluations; no consensus or panel.
- **Chair:** consensus only.
- **Owner:** consensus and panel; no instructions or individual evaluations.
- **Unrelated employee:** none of the four.

The criterion's statement also names the administrator, though the given/when/then does not. So I added a fifth test: the administrator on `swuLapsedChairNotEvaluator` is offered the consensus and the panel. On that opportunity the administrator is an evaluator but neither the chair nor the owner, so both tabs can only come from being an administrator. The two lapsed opportunities are closed into evaluation first through `scheduledTransitionTrigger.runPendingTransitions()`, as the seed's note directs.

**Assumptions.**
- Whether a tab is offered is read as its observation returning something or nothing; the new tab observations carry no other value.
- The chair and owner opportunities are assumed to reach a stage where the consensus tab is offered once they close. The seed's note says they become "being evaluated", and I relied on that; nothing in the surface states the stage directly.
- Only Sprint With Us is exercised. The Team With Us edit page has the same four observations but no seeded opportunity sets up these relationships. The criterion doesn't name a program, so I did not record that as a missing clause.

Nothing else was needed from the surface, and I found nothing more for the contract to add for this criterion. I changed no path outside `tests/acceptance`.

## Fix turn

I fixed the failed check in `tests/acceptance/evaluation/R-5.34.spec.ts`, but I didn't re-run the check afterwards. The check flagged every line where a test used a local variable named `page`. That variable was only a short name for `surface.opportunitySwuEdit`, but the check treats the word `page` as a reach past `surface`. I renamed it to `edit` in all five tests. That covers the reads the check listed, such as `() => edit.consensusTab()`, and the unflagged lines that assign it (`const edit = surface.opportunitySwuEdit;`), which contain the same word. A search now finds no `page` left in the file. Every call still goes through `surface.opportunitySwuEdit` to the same four tab observations, so what the tests sign in as, open and assert is unchanged. R-5.34 still has a test file and no entry in `not-testable.yaml`.
