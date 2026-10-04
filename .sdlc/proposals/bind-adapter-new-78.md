---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I answered both conditions."
opened: 2026-10-04T09:13:18.888Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I answered both conditions.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I answered both conditions. Neither is deferred. The binding could not be typechecked or run in this session: tsc, node and python all need approval nobody was there to give, so the new code was checked only by reading it against the helpers it calls.

**Condition 1: the successful proponent.** On the running target, the awarded Code With Us opportunity (…a008…) and the awarded Sprint With Us opportunity (…a020…) both draw a region headed "Successful proponent" whose paragraph is "Northern Pines Digital Ltd.". I added one shared reader for it. It waits out the "Loading opportunity…" placeholder, finds that region in the main area, and returns the first line under the heading. That matches the old target, which returns the name alone. The Code With Us view and the shared Sprint With Us / Team With Us view now try this region first. They fall back to the older "awarded to <name>" wording if the region isn't there, and return empty when neither is on the page. The seed has no awarded Team With Us opportunity, so that program's reader is shared with Sprint With Us rather than separately walked. I corrected the bindings.yaml comment that said the awarded page names no winner.

**Condition 2: the controls on the staff proposal screens.** Signed in as the administrator, every program's proposal screen now has a "Proposal actions" group, and its buttons depend on the proposal's state:
- **Code With Us:** a submitted proposal (…a003…101) offers "Enter score" and "Disqualify"; an evaluated one (…a007…101) offers "Award" and "Disqualify". The evaluated one also shows a Rank ("1 of 2") beside the Score.
- **Sprint With Us:** …a019…101 offers "Award" and "Disqualify".
- **Team With Us:** …8000…841 offers "Disqualify", and the proposal evaluated at the challenge (…a033…101) offers "Award" and "Disqualify".

I opened every dialog and cancelled each one, so the shared seed is unchanged:
- **Enter score:** a "Score (%)(required)" box, then "Enter score".
- **Disqualify this proposal?:** a "Reason (required)" box, then "Disqualify proposal".
- **Award this proposal?:** just "Award proposal".

Pressing the confirm button with the score or reason left empty leaves the dialog open with a message; I tried this only with empty fields.

These are now bound:
- Code With Us: `enter_score`, `award_proposal` and `disqualify_proposal`.
- Sprint With Us and Team With Us: `award_proposal` and `disqualify_proposal`.

The condition named only "Disqualify" on Team With Us, but I saw "Award" there too and bound it in the same way.

How the actions behave:
- **Filling the form:** each action fills the dialog from the test's input. A bare value goes into the dialog's own box, and each key of an object is matched to a box by its label when the action runs. A key with no matching box throws `unbound`, naming the key and the boxes the dialog does have.
- **Control not offered:** if the screen doesn't offer the control to this person in this state, the adapter records a refusal and returns, which is how this binding already handles the vendor's own proposal screen. The old target's binding throws `unbound` in that case instead, so this is a deliberate difference.
- **Input refused:** if the dialog stays open after confirming, its message is recorded and the dialog is cancelled.
- **Disabled button:** this throws at once, with what the dialog says.

**Other changes.** I removed the old Code With Us "lacks" stubs and the Sprint With Us / Team With Us lack entries for these members. I also updated the comments and unbound reasons that still said these screens have "no button of any kind". The other proposal-screen members (the stage scores, screen in/out, stage tabs, rank) are untouched.

**Other criteria in the list (R-2.5 and R-2.35).** I looked again and both stay unbound:
- **R-2.35:** the Sprint With Us proposal past the code challenge (…a027…101) still has only the Proposal and History sections, and its actions hold only "Disqualify". There is no control to enter a code challenge score. I added this to that member's reason.
- **R-2.5:** the Sprint With Us management screen (…8000…701/edit) still offers only Summary, Opportunity, Addenda, History, Proposals and Evaluation panel, with no instructions, evaluation or consensus section.

I did not walk these screens as the public sector employee who authored the opportunities. The actions don't depend on who is signed in: they press whatever the screen offers that person. Every route touched in this revision resolved on the target, and nothing was written outside `tests/adapters/new/`.
