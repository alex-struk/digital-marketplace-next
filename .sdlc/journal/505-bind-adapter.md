---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-10-04T15:37:07.623Z"
cost: 0.5352524000000001
turns: 20
session: "e49002ad-c190-46a9-8e12-c1ba7373a979"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

I added `start_editing` to both evaluation panel pages, Sprint With Us and Team With Us, in the old adapter, and both are listed as `bound` in `tests/adapters/old/bindings.yaml`. I couldn't run the type check: the `tsc` command needed approval this session couldn't give, so the change is untested beyond what I saw in the browser.

**What the page does.** I signed in as the administrator and opened the Evaluation Panel tab of the seeded closed Sprint With Us opportunity, which is at Team Questions Evaluation. The tab opens read-only. Each evaluator is shown as "Evaluator N", with their name and email beside "Panel Member" and a "Panel Chair" checkbox that can't be clicked. Below them is a "Chair" line naming who chairs. The top bar carries an "Edit" control. I pressed it, and the panel became changeable:
- a "Panel Member*" chooser for each evaluator
- "Add an evaluator"
- a "Chair*" chooser
- "Save Changes" and "Cancel" in the top bar

I saved nothing, so the seeded panel is unchanged. I did not open the Team With Us tab. Its route has the same form, and the old binding already serves both programs with one set of code.

**How it is bound.** `startEditing` reuses the existing `editingPanel` helper, which the adapter already ran before every change to the panel. If the panel is already open for changes, it does nothing. Otherwise it presses "Edit" in the top bar and goes to the "Evaluation Panel" step if editing reopens the opportunity's wizard. If the tab shows evaluators but no "Edit", as it does at consensus, the action makes no change and throws nothing. That leaves the locked state for `panel_locked_after_consensus` to report, which is how the other panel actions already behave. It throws `unbound:` only when the tab shows neither evaluators nor "Edit".

Every route these pages use resolved on the target. Nothing else in the adapter or bindings changed, and I wrote nothing outside `tests/adapters/old/`.