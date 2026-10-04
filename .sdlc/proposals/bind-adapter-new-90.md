---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I changed one thing: how the adapter reads a term's definition on the proposal screen."
opened: 2026-10-04T20:59:32.927Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I changed one thing: how the adapter reads a term's definition on the proposal screen.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I changed one thing: how the adapter reads a term's definition on the proposal screen. I couldn't reproduce the empty Status reading itself, and I couldn't run the type check, so the gate should treat this fix as unconfirmed until R-2.3 runs again.

**What I saw on the target.** Signed in as two different vendors, I created and submitted a Code With Us proposal on the seeded open opportunity (`…8000-000000000601`) both times. Each time I sampled the screen every ~100 ms after the terms dialog's "Submit proposal". By the first sample, about 120 ms after the click, the browser was already on `/proposals/<id>/edit`. The screen showed nine terms and nine definitions, starting with "Status" → "Submitted", then "Submitted", "Proposal ID" and "Opportunity ID". The old reader would have read "Submitted" both times.

**Why it still read "" in the failing run.** The old `proposalTerm` read the page once, with no wait, and paired terms with definitions by position. It returned "" whenever the two counts differed, even for a moment. So a single read taken while the screen was still being drawn, or while one row was drawn without its definition, gives exactly the empty answer the ruling describes.

**What I changed** (`proposalTerm` in `tests/adapters/new/index.ts`):
- **It waits.** It keeps reading the terms until the one asked for appears with its definition, for up to 10 seconds.
- **It still reports nothing when there is nothing.** If the screen's terms stay unchanged for a moment (after at least 1.5 s) and the term isn't among them, it returns empty. A screen that doesn't carry Score or Rank therefore still reads as empty, after a short wait rather than the full 10 seconds.
- **It pairs by order when the counts differ.** It now takes the definition drawn directly after the term, from the page's accessibility tree. Pairing by position is kept when the counts match, so every reading already accepted returns the same thing as before.
- I ran the new pairing logic against the live submitted proposal, and every pair came out right, including Status → Submitted.

**What stays the same.** Every reading that goes through this function picks up the wait, not just Status: Proposal ID and Opportunity ID, Submitted, Score, Rank, and the status quoted in refusal notes. Nothing else changed, and `bindings.yaml` is untouched because `status` was already bound. Every route I used resolved on the target.

**Not checked.**
- I couldn't run the TypeScript type check: running `tsc` needed approval this session doesn't have, so the code was reviewed by eye only.
- The failure evidence the ruling cites (`.sdlc/evidence/slice-21/R-2.3.png` and `.txt`) is not in this workspace, so I worked from the ruling's description of it.
- The two submissions I made while walking the flow are still on the target, as submitted proposals by test-vendor-1 and test-vendor-2 on the seeded open Code With Us opportunity.
