---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I added `start_editing` to both evaluation panel pages, `evaluation-panel-swu` and `evaluation-panel-twu`, in `tests/adapters/new/index.ts`, and named it as `bound` for both in `tests/adapters/new/bin…"
opened: 2026-10-04T15:40:37.338Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I added `start_editing` to both evaluation panel pages, `evaluation-panel-swu` and `evaluation-panel-twu`, in `tests/adapters/new/index.ts`, and named it as `bound` for both in `tests/adapters/new/bin…

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I added `start_editing` to both evaluation panel pages, `evaluation-panel-swu` and `evaluation-panel-twu`, in `tests/adapters/new/index.ts`, and named it as `bound` for both in `tests/adapters/new/bindings.yaml`. I couldn't type-check the adapter: running `npx tsc --noEmit` was refused for lack of approval, so I only checked by reading that the helpers it calls exist with the expected signatures. Nothing has been run against the target yet.

**What the target shows.** Signed in as the administrator, I opened the Evaluation panel tab on the seeded closed Sprint With Us opportunity (status "Team questions: individual evaluation") and on the seeded closed Team With Us opportunity. Both tabs open ready to change straight away: each evaluator has a chooser, a "Chair" box and a "Remove" button, and the section also has "Add an evaluator", the "Chair (required)" chooser and "Save evaluation panel". Unlike the old target, the tab is never read-only first and has no "Edit" step of its own. There is an "Edit" button under "Opportunity actions", but it belongs to the opportunity: pressing it sent me to `?tab=opportunity`. So that button is not the panel's start-editing control.

**How the action works.** `start_editing` opens the panel tab and treats it as editable if "Add an evaluator" or "Save evaluation panel" is there. It never presses the "Opportunity actions" Edit. If a later build shows the panel read-only first and puts an "Edit" button inside the panel section itself, the action presses that. If the panel shows its "can no longer be changed" note, the action records the refusal and returns rather than failing, the same way the other panel actions already do, so the test's own check of `panel_locked_after_consensus` decides the outcome. If the section has no lock note and none of those controls, it throws `unbound:` and lists the buttons the section does offer.

**Compared with the old target.** The old adapter's version presses the "Edit" in the top bar and then goes to the wizard's "Evaluation Panel" step. On the new target the action does not change the page; it only confirms the panel is editable. Tests that call it before changing the panel get an editable panel either way.

Every route I opened worked, and nothing outside `tests/adapters/new/` was changed.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does bind-adapter-new-85 bind the surface's start_editing action on evaluation-panel-swu and evaluation-panel-twu for the new target, and nothing else? Ruling: approve. The new startEditing (tests/adapters/new/index.ts) only navigates and locates. It reaches the tab through the existing reached/editable helpers. If the panel shows its lock note, editable records the refusal and returns, the same way every other panel action does, so the test's own reading of panel_locked_after_consensus decides the outcome. It returns as soon as "Add an evaluator" or "Save evaluation panel" is in the section. It presses an "Edit" only when one is drawn inside the "Evaluation panel" section itself (section() is scoped to that named region), so it never presses the opportunity's own "Edit" under "Opportunity actions", which the receipt reports leaves for ?tab=opportunity. It throws unbound only when the section has no lock note and none of those controls, and it lists the buttons the section does offer, which is a genuine absence and not a convenience. No assertion and no pass/fail logic. Both pages are marked bound in bindings.yaml, with a comment saying how the binding was walked. Nothing under tests/acceptance or any protected path changed. Every changed file is inside tests/adapters/new/, apart from the pipeline's own journal, proposal and run records. The authoring agent could not run tsc, but the runner's typecheck on revision 8fc1c7eab passed with no diagnostics under adapters/new/, which closes that gap. The receipt states plainly that nothing has been run against the target yet. Whether the binding behaves at runtime is for verify and calibrate to show, and the receipt does not claim otherwise. The open missing-test warning on R-5.27 is already owed by derive-tests and is not this adapter's to discharge. The ruling would change if the binding asserted or decided an outcome, if it pressed the opportunity-level Edit, or if the typecheck result were stale for this revision.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `8fc1c7eabe9ce51f29aea5866b8735acabe5680b`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
