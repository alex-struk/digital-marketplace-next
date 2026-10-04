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
