---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I changed one thing in the new adapter."
opened: 2026-10-04T14:15:59.877Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I changed one thing in the new adapter.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I changed one thing in the new adapter. Confirming the finalize step on the consensus screen used to throw when the page refused it; it now finishes normally. I couldn't type-check the result because the type-check command wasn't approved in this session. No tests were run and I didn't reopen the target in the browser.

**The fix (request 1, R-5.10).** Both consensus screens, `evaluation-consensus-list-swu` and `evaluation-consensus-list-twu`, share one confirm routine. When the page answered with the alert "The consensus scores could not be finalized …", that routine saved the alert text and then threw at `tests/adapters/new/index.ts:2130`. That stopped the test one step before `noScreenableProponentError()` reads the text. Now the routine saves the text and stops waiting without an error. The section comes from the ruling: on the seeded Sprint With Us and Team With Us opportunities, the refusal is what the test expects to see.

I didn't need to change `noScreenableProponentError()`. It already treats a saved refusal as proof the user reached the screen. It returns the lines that mention screening or proponents, so it hands back "You must have at least one proponent that can be screened into the Code Challenge." (or "… the Challenge." on Team With Us). That matches the old target's binding, which filters on the same words.

Nothing else changed. `notAllConsensusesSubmittedError()` reads the same saved text and benefits the same way. The "Submit consensus scores" confirmation still throws when it is refused, because the ruling didn't mention it. In `bindings.yaml`, both members were already listed as `bound` on both pages and still are, so I left the file as it was.

**Not checked.** The edit only swaps a `throw` for a `break` inside the same loop and adds a comment, so I don't expect a type error.

Every route the contract names was already handled in the approved binding, and I found no new page whose route fails to load. Nothing was deferred.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does the new adapter bind every surface action and observation on new, and nothing else? Approve. The diff changes one line in confirmFinalize (tests/adapters/new/index.ts:2130-2133). When the finalize confirmation is refused, the routine now stores the alert text in finalizeRefusal and breaks out of its wait loop instead of throwing. Both evaluation-consensus-list-swu.confirm_finalize_consensus and evaluation-consensus-list-twu.confirm_finalize_consensus therefore complete when the page answers with the refusal. noScreenableProponentError (through afterAControl, which accepts a stored finalizeRefusal) can then return the lines naming the Code Challenge or the Challenge, which is what R-5.10's test reads. The binding remains navigation and locating only. It contains no assertion and does not decide the outcome, nothing under tests/acceptance changed, and the runner-owned typecheck of the proposal revision passed with no diagnostics under adapters/new. The open conditions build-slice-18-2#2 and #3 concern R-6.15 mail recipients, are owed by build, and are not settled here, so they remain open. The ruling would change if a verify run showed the refusal text still not reaching noScreenableProponentError, or if the break swallowed a refusal on a path where the test expects finalizing to succeed.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `e9112987f021fecd3395cf98cf540b9464a4e56c`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
