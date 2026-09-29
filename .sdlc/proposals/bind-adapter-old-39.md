---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I fixed the four failures the calibration run pinned on the `old` adapter's Sprint With Us proposal form."
opened: 2026-09-29T06:14:03.230Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I fixed the four failures the calibration run pinned on the `old` adapter's Sprint With Us proposal form.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

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

## Ruling

**Verdict:** approve
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the old adapter bind every Sprint With Us proposal-form action and observation, and nothing else? Ruling: approve. The runner escalated because R-2.7, R-2.11, R-2.19 and R-2.37 went back to bind-adapter 4 to 6 times, past the limit of 2 in policy.loops.rebind. The part of its account that decided this ruling is what each send asked for: each one got further into the same form (organization chooser, then team box, then references, then terms dialog, then the leftover empty dialog). That is a form hiding its problems in layers, not a stage that cannot produce what G3 asks for, so there is nothing to escalate to the pipeline's owner. The tier is STANDARD and no platform article is touched. The diff answers each most recent send and stays inside tests/adapters/old/index.ts. Phase sections count as open when 'Phase Dates' or 'Add Team Member(s)' shows below the name, and only a folded name is pressed, once (R-2.7 send 4, R-2.19 send 6). set_phase_proposed_cost presses the form's own 'Next' until a phase cost field shows (R-2.7 send 4). 'Submit Proposal' is found by its text inside the open terms dialog, and press() tries a click for at most 8 seconds and three times, where before it waited without limit at line 578 (R-2.11 send 4). A dialog with no text is treated as gone (R-2.37 send 5, which asked for exactly that). The two changes that reach beyond the form, the time limit in press() and the no-text rule in dialog(), were both asked for directly by the failures. bindings.yaml is unchanged. The runner's typecheck shows no errors under adapters/old/; its two errors are under adapters/new/, which this proposal does not answer for. Nothing was run, so the next calibration run is the first real test. The author also left a submitted proposal on the shared target at port 4300. Calibration runs on separately seeded instances (ports 3100-3102), but if it ever reads the shared target, it must be re-seeded first, because R-2.11 turns on whether an organization has already bid. What would change this ruling: calibration failing again on any of these four criteria at the same point.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `7e0044f12f3f2767ce4794e74db52362bf38bea8`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
