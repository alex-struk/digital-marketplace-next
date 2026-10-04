---
gate: G3
question: "Do the revised opportunities tests now follow from their criteria and from nothing else?"
recommendation: "I made both changes to `tests/acceptance/opportunities/R-1.1.spec.ts`, but the typecheck did not run, so the edits are unchecked."
opened: 2026-10-04T15:16:58.458Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Do the revised opportunities tests now follow from their criteria and from nothing else?

**Recommendation.** I made both changes to `tests/acceptance/opportunities/R-1.1.spec.ts`, but the typecheck did not run, so the edits are unchecked.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I made both changes to `tests/acceptance/opportunities/R-1.1.spec.ts`, but the typecheck did not run, so the edits are unchecked. Running `tsc` here needed an approval that nobody was present to give. I checked by hand that every page and reading the new code uses exists in `tests/generated/surface.d.ts` under the name used, but the runner's typecheck should be run before ruling.

**Condition 1: the note "This opportunity has closed."**
I restored this check for all three programs, so no not-testable entry was needed. The edit page for each program has a History tab reading: `opportunityCwuEdit.historyTab()`, `opportunitySwuEdit.historyTab()` and `opportunityTwuEdit.historyTab()`. The contract shows that tab to an administrator. An existing test (R-2.27) already reads a note's text from the Code With Us History tab, so the reading carries the history's text.

After closure, the administrator now opens the edit page of each seeded opportunity: the lapsed Code With Us one, the closed Sprint With Us one and the closed Team With Us one. The test then waits until each History tab contains the note. These checks sit in the test for the "first evaluation stage" outcome, because the criterion's "then" states the note as part of that move. That test's title now names the note too.

**Condition 2: the stage check.**
The pattern `/evaluat|question/` is replaced with checks for each program's first stage:
- **Sprint With Us** must read "team question".
- **Team With Us** must read "resource question".
- **Both** must not match "consensus", "challenge", "scenario", "processing", "award", "cancel" or "publish". Those words cover every later evaluation stage and every state after evaluation.

The spec gives these stages as "team questions individual" and "resource questions individual". The contract does not spell out the exact text the status reading shows. So the check relies on the stage's distinguishing words rather than a full label, as other existing evaluation tests already do. The Code With Us check is unchanged, since that program has only one evaluation stage.

Nothing else changed. No other test file and no entry in `tests/acceptance/not-testable.yaml` was touched. The existing entry for the third Sprint With Us and Team With Us proposal still stands. The file's header keeps its derived date of 2026-10-04, which is today's date anyway.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: do the revised R-1.1 v3 tests follow from the criterion and nothing else, and do they settle the two conditions derive-tests-opportunities-stale-22 left owed? Ruling: approve. The first-stage test now polls the History tab of the Code With Us, Sprint With Us and Team With Us edit pages for the note "This opportunity has closed.", which the criterion's then states. The stage check now asserts each program's first evaluation stage by its distinguishing words ('team question' for Sprint With Us, 'resource question' for Team With Us) and rules out every later stage and post-evaluation state, in line with the spec's stage list (opportunities.md: team questions individual / resource questions individual first). Code With Us has only one evaluation stage, so 'evaluat' is enough there. The added Code With Us checks follow from the criterion's own clauses: the one submitted proposal moves to review, read by its seeded vendor users.organizationOwner, and the author is announced to. The service address used to find the announcement is quoted from the contract's observables, not from an implementation. The third Sprint With Us and Team With Us proposal is named by a clause-scoped not-testable entry with a real surface gap and contract as its owner, and the ledger already carries it as a missing test owed by contract. The R-1.51 entry was moved, not changed. The runner's typecheck on this revision passed with no diagnostics. What would change this: evidence that the status reading presents the first stage without those distinguishing words, or that the History tab's text does not carry the note.

**Conditions:**
- condition-met derive-tests-opportunities-stale-22#1: tests/acceptance/opportunities/R-1.1.spec.ts, in the 'moves to the first evaluation stage ... with the note' test, polls opportunityCwuEdit/opportunitySwuEdit/opportunityTwuEdit.historyTab() for "This opportunity has closed." on the lapsed Code With Us, closed Sprint With Us and closed Team With Us opportunities, as an administrator
- condition-met derive-tests-opportunities-stale-22#2: tests/acceptance/opportunities/R-1.1.spec.ts now requires 'team question' for Sprint With Us and 'resource question' for Team With Us, and rejects /consensus|challenge|scenario|processing|award|cancel|publish/, so a later evaluation stage no longer passes

### Runner-owned typecheck evidence

Proposal revision: `71cfb8fc38c599fa607514f27010e45729361bc2`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    No diagnostics.
