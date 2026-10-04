| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T15:37:07.671Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I added `start_editing` to both evaluation panel pages, Sprint With Us and Team With Us, in the old adapter, and both are listed as `bound` in `tests/adapters/old/bindings.yaml`.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I added `start_editing` to both evaluation panel pages, Sprint With Us and Team With Us, in the old adapter, and both are listed as `bound` in `tests/adapters/old/bindings.yaml`. I couldn't run the type check: the `tsc` command needed approval this session couldn't give, so the change is untested beyond what I saw in the browser.

**What the page does.** I signed in as the administrator and opened the Evaluation Panel tab of the seeded closed Sprint With Us opportunity, which is at Team Questions Evaluation. The tab opens read-only. Each evaluator is shown as "Evaluator N", with their name and email beside "Panel Member" and a "Panel Chair" checkbox that can't be clicked. Below them is a "Chair" line naming who chairs. The top bar carries an "Edit" control. I pressed it, and the panel became changeable:
- a "Panel Member*" chooser for each evaluator
- "Add an evaluator"
- a "Chair*" chooser
- "Save Changes" and "Cancel" in the top bar

I saved nothing, so the seeded panel is unchanged. I did not open the Team With Us tab. Its route has the same form, and the old binding already serves both programs with one set of code.

**How it is bound.** `startEditing` reuses the existing `editingPanel` helper, which the adapter already ran before every change to the panel. If the panel is already open for changes, it does nothing. Otherwise it presses "Edit" in the top bar and goes to the "Evaluation Panel" step if editing reopens the opportunity's wizard. If the tab shows evaluators but no "Edit", as it does at consensus, the action makes no change and throws nothing. That leaves the locked state for `panel_locked_after_consensus` to report, which is how the other panel actions already behave. It throws `unbound:` only when the tab shows neither evaluators nor "Edit".

Every route these pages use resolved on the target. Nothing else in the adapter or bindings changed, and I wrote nothing outside `tests/adapters/old/`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

The question is whether the old adapter binds the surface's new start_editing action on evaluation-panel-swu and evaluation-panel-twu, and nothing else. Approved. start_editing just calls the existing editingPanel helper (tests/adapters/old/index.ts:7671). That helper presses the top-bar "Edit", moves to the "Evaluation Panel" step if the wizard reopens, does nothing when the panel is already open for changes, and leaves a locked panel (evaluators shown, no "Edit") unchanged and unthrown, so panel_locked_after_consensus can report it. That is navigation only, with no assertion or pass/fail logic. It reports unbound only when the tab shows neither evaluators nor "Edit", where there is genuinely nothing to bind. The diff stays inside tests/adapters/old/, touches nothing under tests/acceptance or any protected path, and both pages are marked bound in bindings.yaml. The authoring agent could not run tsc, but the runner's typecheck on revision 5904bb81d passed with no diagnostics under adapters/old/, which settles the gap the receipt admitted. The ruling would change if the binding asserted or decided an outcome, or if the typecheck result were stale. The missing-test warning for R-5.27 is already owed by derive-tests and is not this proposal's to discharge.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `5904bb81d027686a411084ccd0ce295eb2ff567a`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
