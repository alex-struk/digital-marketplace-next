---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-09-29T06:14:03.201Z"
cost: 1.9061014
turns: 51
session: "b52342e3-250b-40d9-b965-74065425e0bd"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I fixed the four failures the calibration run pinned on the `old` adapter's Sprint With Us proposal form. I couldn't compile or run the suite: this workspace has no installed packages, and the type-check command needs approval that nobody was here to give. So the first calibration run will be the first real test of these changes.

Before editing, I looked at the running target at http://localhost:4300. I signed in as the organization owner and opened the seeded open Sprint With Us opportunity (one Implementation phase). I walked the create form through all six steps and submitted it. What I saw:
- **Team step:** "Implementation" is open as soon as an organization is chosen, with "Phase Dates" and "Add Team Member(s)" below it. "Add Team Member(s)" is an anchor with no address, so it has neither a button nor a link role.
- **Step list:** the form shows only the current step's name. Pressing it drops down a list of all six steps, which takes a moment to appear.
- **Terms dialog:** "Review Terms and Conditions" has two acknowledgement checkboxes and "Submit Proposal", which is pressable text, not a button or link.
- **After submitting:** the page moved straight to the stored proposal.

Changes in `tests/adapters/old/index.ts`:

- **R-2.7 and R-2.19 (phase sections):** a section now counts as open when "Phase Dates" or its "Add Team Member(s)" appears between its name and the next phase's name. The adapter first allows up to a second for an open section's contents to appear. Only then does it press a folded name, once, and waits up to five seconds for the section to open and stop moving before the next phase. A section that is already open is never pressed, so it can't be folded shut again.
- **R-2.7 (getting to "3. Pricing"):** `set_phase_proposed_cost` still tries the step list first, which now waits for its entries to appear. If that doesn't show a cost field, it presses the form's "Next" until "Implementation Cost*" (or the named phase's cost field) appears. A disabled "Next" is reported straight away with the step it's on.
- **R-2.11 (terms dialog):** the create form's submit now finds "Submit Proposal" by its text inside the open dialog and presses it. If it is disabled, the error names the unticked checkboxes. The adapter then waits for the dialog to go. More generally, `press()` no longer waits indefinitely on a click that can't land: it gives up after 8 seconds, looks for the control again, tries at most three times, then reports it.
- **R-2.37 (empty dialog):** a dialog with no text is now treated as gone everywhere the adapter checks for dialogs. The emptied, closing dialog left after submitting no longer blocks anything or triggers the "dialog stayed open" error, so `proposal-swu-export-one.open` goes to the export address as it should.

**`bindings.yaml`:** unchanged. Every `proposal-swu-create` and `proposal-swu-export-one` member was already bound, and nothing in these findings is unbound. Every page route I used resolved on the target.

**Side effect on the target:** while checking the dialog, I submitted a real proposal from the owner's organization on the seeded open Sprint With Us opportunity, and it is still stored as Submitted. Unless the seed is re-applied before the next calibration, a test that expects that opportunity to have only its seeded proposal could see an extra one.

I didn't need to change anything outside `tests/adapters/old/`, and nothing asked me to.