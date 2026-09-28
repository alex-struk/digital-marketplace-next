---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I could not run the TypeScript type-check: `tsc` needed a permission this session doesn't have, so the new code has not been compiled or run as an adapter."
opened: 2026-09-28T16:40:15.973Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I could not run the TypeScript type-check: `tsc` needed a permission this session doesn't have, so the new code has not been compiled or run as an adapter.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I've added the 12 new members to the "old" adapter, and all of them are bound, both Team With Us and Sprint With Us. I could not run the TypeScript type-check: `tsc` needed a permission this session doesn't have, so the new code has not been compiled or run as an adapter.

**Why these pages are requests, not screens.** The two new pages, `evaluation-consensus-request-swu` and `evaluation-consensus-request-twu`, are calls to the service's own interface rather than screens. The adapter already had a way of sending those from the browser's signed-in session, used by the individual-evaluation request pages. I added one shared helper next to that code and built both pages from it. The existing bindings were left as they were.

**What the target showed.** I signed in as the administrator and used the seeded records the contract points to.
- **Reading a consensus:** it comes back with a status (`SUBMITTED`) and four scores, each with its question order and note. Reading the chair's consensus for the first proposal of `swuConsensusAllAgreed`, `twuConsensusAllAgreed` and `swuPastConsensus` gave agreed scores of 4, 4, 4, 4 and the seeded notes, as the seed manifest says.
- **How the edit screen saves:** it sends the whole set of scores, each with its order, score and notes. I tested this by writing the seeded values back unchanged to the second proposal of each consensus opportunity. The data was not altered; only the "last updated" time moved.
  - As the administrator, the Sprint With Us and Team With Us changes were both accepted, and the answer carried the consensus.
  - As the administrator on the opportunity that has moved past consensus, the change was refused with 401 and a "permissions" message.
  - Signed in through the government-staff sign-in route, both the change and the read were refused with 401. I did not confirm which seeded person that route signs in as.

**How each member reads.**
- **`change_consensus_by_request`:** sends every score and note the test gives, in question order. It uses the same input parsing as the individual evaluations. If the input has no scores it throws `unbound:` rather than sending an empty change. A score given without a note is sent with an empty note.
- **`stored_scores` and `stored_notes`:** re-read the consensus on the side and return one "order: value" line per question. If the signed-in person is refused the read, they return empty.
- **`consensus_status`:** re-reads the consensus and returns its status, or empty if the read is refused.
- **`request_accepted`:** the latest answer when the service accepted it, otherwise empty.
- **`refused_when_not_permitted`:** the latest answer when it is a 401, 403 or 404, otherwise empty.

Every observation throws `unbound:` if no consensus has been opened.

**Route check.** Both new routes resolved on the target. No page's route failed to resolve.

The bindings file names all 12 as bound, spelled as the contract spells them, and nothing outside `tests/adapters/old/` was changed.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

Question: does the old adapter bind every action and observation of evaluation-consensus-request-swu/-twu, and nothing else? Approve. The bindings file names all 12 members as the contract spells them. The code opens the consensus address, sends the edit screen's save shape {tag: edit, value: {scores}}, and returns what the service stored (scores, notes and status by question order, the accepted answer, and a refusal whose status and body are passed back as they are). Counting 401/403/404 as a refusal matches the contract, which defines refused_when_not_permitted as 'a permission or not-found error'. Nothing in the code decides whether a test passes: an observation with nothing to read answers empty or throws unbound. The diff touches only tests/adapters/old/ plus the pipeline's own records, and nothing under tests/acceptance. The authoring agent could not run tsc, but the runner's typecheck on this revision reports no diagnostics under adapters/old/; the only failures are 2 in adapters/new/, which this proposal does not answer for. The R-5.29 clause about who may change a consensus and when is already owed by derive-tests. What would change the ruling: a typecheck diagnostic under adapters/old/, or a calibration showing these bindings answer from the wrong place (for example stored_scores reading the individual evaluation rather than the chair's consensus).

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `63a24137de3782a7790e104ad53b1d6174d0ddef`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
