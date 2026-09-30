---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I fixed the three members the calibration run marked as failing and gave \"Start Proposal\" a second path."
opened: 2026-09-30T04:20:21.326Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I fixed the three members the calibration run marked as failing and gave "Start Proposal" a second path.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed the three members the calibration run marked as failing and gave "Start Proposal" a second path. All changes are in `tests/adapters/old/index.ts`. I could not run the type-checker: every way of starting `tsc` needed a permission this session didn't have. So the edits have been read carefully but not compiled, and the calibration suite has not been re-run against them.

**What changed**

- **R-2.19, the team-proposal refusal reader.** Messages about a Sprint With Us phase now carry the phase name capitalised, the way the criteria write it: "Inception", "Prototype" or "Implementation". The part of the phase the message is about still follows, and the service's own message text is untouched. So the entry in the finding now reads "Inception phase: This opportunity does not require this phase." I didn't see that refusal come back live. A test request to the closed seeded opportunity was refused as a duplicate first, and making it happen for real means publishing a new opportunity. The shape I built on is the one the finding itself quotes.

- **R-5.25, "is Submit Scores for Consensus withheld?"** It used to return a word like "enabled", which counts as true, so an enabled button read as withheld. It now returns an empty string when the button is offered and enabled. Otherwise it returns a short reason: the button is disabled, or it isn't offered.

- **R-1.17, the Sprint With Us manage page's team questions.** The sidebar "Team Questions" tab is the proponents' scoring table, not the opportunity's own questions. The questions live on the "Opportunity" tab, in a wizard step called "5. Team Questions". I found them there as an administrator on the seeded closed Sprint With Us opportunity. The reader now:
  - opens that tab and steps through with "Next" to that step;
  - reports each question in order, with its guidelines, word limit, score and minimum score.

  Stepping through the same way in the browser gave "Seeded team question one." through "four." in order.
  - If the person isn't offered the Opportunity tab, it returns nothing.
  - If the tab opens but has no Team Questions step, it throws `unbound`.

- **R-2.2, "Start Proposal" on a Code With Us opportunity.** I reopened the seeded published opportunity as vendors 1 and 2. Both see two "Start Proposal" links (top bar and page header) leading to the proposal-create page, and the adapter already handles that. The opportunity from the failed run no longer exists on the target; the data has been reset. The failure message itself shows why it failed: vendor 1 already had a proposal on that freshly published opportunity. The site then offers "View Proposal" instead, because it allows one proposal per person per opportunity.
  - `start_proposal` now presses "View Proposal" in that case, which takes the vendor to their existing proposal.
  - It still throws `unbound` if neither link appears.

  **Decision for you:** I couldn't read the R-2.2 test, and pressing "View Proposal" is my reading of what the contract's `start_proposal` should mean once a proposal exists. If the criterion instead expects starting a second proposal to be refused, this fallback is the wrong choice and should be removed.

`bindings.yaml` needed no edits: all of these members were already listed as bound, spelled as the contract spells them. No page route failed to resolve. Nothing I needed was outside `tests/adapters/old/`, and I left the other paths alone. No password or environment value appears in anything I wrote.
