---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-10-04T15:40:37.289Z"
cost: 0.8242236
turns: 28
session: "4394c284-100b-4a87-9031-eb4ccc4979ea"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

I added `start_editing` to both evaluation panel pages, `evaluation-panel-swu` and `evaluation-panel-twu`, in `tests/adapters/new/index.ts`, and named it as `bound` for both in `tests/adapters/new/bindings.yaml`. I couldn't type-check the adapter: running `npx tsc --noEmit` was refused for lack of approval, so I only checked by reading that the helpers it calls exist with the expected signatures. Nothing has been run against the target yet.

**What the target shows.** Signed in as the administrator, I opened the Evaluation panel tab on the seeded closed Sprint With Us opportunity (status "Team questions: individual evaluation") and on the seeded closed Team With Us opportunity. Both tabs open ready to change straight away: each evaluator has a chooser, a "Chair" box and a "Remove" button, and the section also has "Add an evaluator", the "Chair (required)" chooser and "Save evaluation panel". Unlike the old target, the tab is never read-only first and has no "Edit" step of its own. There is an "Edit" button under "Opportunity actions", but it belongs to the opportunity: pressing it sent me to `?tab=opportunity`. So that button is not the panel's start-editing control.

**How the action works.** `start_editing` opens the panel tab and treats it as editable if "Add an evaluator" or "Save evaluation panel" is there. It never presses the "Opportunity actions" Edit. If a later build shows the panel read-only first and puts an "Edit" button inside the panel section itself, the action presses that. If the panel shows its "can no longer be changed" note, the action records the refusal and returns rather than failing, the same way the other panel actions already do, so the test's own check of `panel_locked_after_consensus` decides the outcome. If the section has no lock note and none of those controls, it throws `unbound:` and lists the buttons the section does offer.

**Compared with the old target.** The old adapter's version presses the "Edit" in the top bar and then goes to the wizard's "Evaluation Panel" step. On the new target the action does not change the page; it only confirms the panel is editable. Tests that call it before changing the panel get an editable panel either way.

Every route I opened worked, and nothing outside `tests/adapters/new/` was changed.