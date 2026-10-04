---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "The only change to `bindings.yaml` was swapping those fourteen stale `unbound` reasons for `bound`."
opened: 2026-10-04T14:04:02.759Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** The only change to `bindings.yaml` was swapping those fourteen stale `unbound` reasons for `bound`.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I've rebound all seven stale members on both consensus-list pages. The only change to `bindings.yaml` was swapping those fourteen stale `unbound` reasons for `bound`. I couldn't typecheck the adapter afterwards: the sandbox refused to run `tsc` without approval, and there was nobody here to give it.

**What the page shows now.** I signed in as the administrator who chairs the seeded panels, through the identity provider's own form, and opened the Consensus section of three seeded opportunities. Two were Sprint With Us (the one with a consensus still outstanding, and the one with six proponents) and one was Team With Us (five proponents). The section no longer shows just one sentence. Below a short paragraph it has:

- **A table** captioned "Agreed scores, by anonymous proponent name", with columns Proponent, Consensus and Action. Each row links to that proponent's consensus sheet, as "Start consensus" or "Edit consensus".
- **A "Submit final consensus scores" button.** It's greyed out while any consensus is incomplete (there it sits under "You can submit once every proponent has a complete consensus…"). Where it was enabled, pressing it opened a dialog, "Submit the final consensus scores?", with "Cancel" and "Submit consensus scores".

I checked "Cancel" on the six-proponent Sprint With Us opportunity, and it closed the dialog. I then pressed "Submit consensus scores" once on that same opportunity, which changed it on the running target. Its consensus was already submitted, so the visible state is the same, but the page says the owner and every administrator are told. The page answered with a note in the section's status area: "The consensus scores have been submitted".

**What changed in the adapter.** Most of `tests/adapters/new/index.ts` already looked things up the way the page now draws them, so I left it alone. Two changes:

- **`confirm_submit_consensus`** used to press the dialog button and move on. It now waits for either the "submitted" note or a new alert. If the alert is a refusal, it reports that refusal instead of carrying on silently.
- **Two code comments** still said the Consensus section was a single sentence; I rewrote them.

**How the readings compare with the old binding.** `proponent_row` and `consensus_status` return one line per table row, with cells joined by " | " (for example "Proponent 1 | Submitted | Edit consensus"). That's the same form the accepted Evaluation-section reading uses. The old binding returned the table's raw text with the header row included, so the words a test looks for are the same, but the line layout differs.

**What I left alone.** Everything the ruling didn't name: the four consensus sheets, finalize and its dialog, and the refusal readers. The failures quoted with the ruling came from the run before those were rebound. Those methods now find "Finalize consensus scores" in the "Opportunity actions" bar and accept the "Page not found" answer on the consensus sheets as the application's refusal. Every page route I opened resolved on the target, and I changed nothing outside `tests/adapters/new/`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

The question is whether bind-adapter-new-83 binds every surface action and observation on new and nothing else. It does: on evaluation-consensus-list-swu/-twu every member now reads `bound`, matching what was rewalked as the chair (the 'Agreed scores, by anonymous proponent name' table read one row per line with cells joined by ' | ', 'Submit final consensus scores' and its dialog, 'Finalize consensus scores' in the 'Opportunity actions' bar, and the refusal alert), and the four consensus sheets move off the notServed stub onto consensusSheetPage, which fills the 'Agreed score/comment for question N' boxes, presses the 'Consensus actions' controls, and returns what the page shows ('Page not found', the 'Only the chair records the consensus' note, the duplicate alert) without deciding a verdict. Read against tests/acceptance/evaluation/R-5.29.spec.ts, the bindings fit what the test reads: consensusStatus returns empty where the sheet is refused, which is what the before-consensus and non-chair cases read back, and proponentRow names each proponent once per line for the duplicate count. Nothing under tests/acceptance changed, and the runner-owned typecheck on f5b5c05 passed with no diagnostics under adapters/new/. The ruling would change on a run showing a chair-reachable sheet reported as refused, or on any stale unbound/absent reason left on these pages.

**Conditions:**
- condition-met bind-adapter-new-82#1: every member of evaluation-consensus-list-swu and evaluation-consensus-list-twu in tests/adapters/new/bindings.yaml now reads `bound` against the rewalked Consensus section (table 'Agreed scores, by anonymous proponent name', 'Submit final consensus scores' and its dialog, 'Finalize consensus scores' in the 'Opportunity actions' bar), implemented in evaluationConsensusListPage in tests/adapters/new/index.ts

### Runner-owned typecheck evidence

Proposal revision: `f5b5c05c3cac83a2a0b7d8dc6e4d65caa2fa5546`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
