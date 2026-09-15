---
gate: G3
question: "Do these tests follow from the proposals criteria and from nothing else?"
recommendation: "I wrote tests for both proposals-domain criteria and added nothing to not-testable.yaml."
opened: 2026-09-15T02:39:29.481Z
---

# Do these tests follow from the proposals criteria and from nothing else?

**Recommendation.** I wrote tests for both proposals-domain criteria and added nothing to not-testable.yaml.

I wrote tests for both proposals-domain criteria and added nothing to not-testable.yaml. Neither test has been run or type-checked: no TypeScript compiler is installed here and nothing in this workspace can run the suite. I checked every page, action and observation the tests call against the generated surface declaration by eye, and neither ID appears in not-testable.yaml.

**R-2.2 v2 (one proposal per opportunity)** replaces the v1 test. An administrator publishes a Code With Us opportunity and the vendor saves a draft proposal against it. The vendor then clicks start proposal on the opportunity page. The test checks two outcomes of that click:
- **Taken to the proposal they already hold:** the page the vendor lands on shows the first proposal's identifier and its text.
- **No second proposal:** the vendor's own dashboard lists the opportunity exactly once. The old test only checked that the first proposal still had its text.

One test covers both, because both follow from the same click. The test does not check the clause saying a request to create a second proposal is refused with a message. The v1 test tried that by opening the create page again and saving. But v2 says a vendor who starts a second proposal is sent to the one they already hold, so there is nowhere in the surface to send that request from. `proposal-cwu-create` has no action that sends a create request by itself, and its `field_error` stays empty unless such a request gets through. I kept the redirect test instead of marking the criterion not-testable, and the file's comment says which clause is missing.

**R-2.35 v1 (proposal history)** replaces the v1 test, which a note in redo.yaml sent back for reading the history as the vendor. Now the administrator reads it. The earlier test had also skipped the score and the author. Those skips rested on the claim that a test walking a seeded opportunity through evaluation uses it up for every other test. That is no longer true: the test fixture resets the target to its seed before every test. The new test uses the seeded Sprint With Us opportunity and its first proposal, which is seeded as submitted:
1. The closing hook puts the proposal under review.
2. Both evaluators score every proponent, and the chair agrees and finalises the scores, which moves the proposal to the code challenge.
3. The administrator enters a code challenge score.
4. The administrator disqualifies the proposal with a written reason.

The test then checks that the history names each of those changes and the score, and that it contains:
- the reason text;
- the administrator's name, taken from their own profile page rather than typed into the test;
- the current year.

It also checks the order: the reason comes before the code challenge entries, which come before the submission.

Two of those checks are coarse, because `history_tab` returns the whole history as one block of text. "When" is only the current year, and "newest first" is only the order in which strings appear.

I found none of the surface actions or observations these tests needed missing, but two additions would let them be finished or tightened:
- **R-2.2's refusal clause** needs an action on `proposal-cwu-create` (and its Sprint With Us and Team With Us siblings) that sends a create request for an opportunity the vendor already holds a proposal for, without being redirected. The refusal would then show up in `field_error`, or in a dedicated `already_have_proposal_error` observation.
- **R-2.35** would be more exact with an observation that returns proposal history one entry at a time, each with its event, author, time and note, instead of `history_tab`'s single block of text.

Every not-testable entry for evaluation criteria past the first stage relies on the same "the walk uses up the seeded opportunity" argument, including those for R-2.27, R-2.29 to R-2.33, R-1.41 and R-1.42. Those entries are not mine to change. But since the target is reset before every test, the contract stage should revisit them.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

The question is whether the R-2.2 v2 and R-2.35 v1 tests follow from their criteria and from nothing else. Approve. R-2.2: the test clicks start proposal on the opportunity page, then checks that the page the vendor lands on shows the first proposal's identifier and text ('taken to the proposal they already hold'), and that the vendor's dashboard lists the opportunity once ('no second proposal is created'). Both assertions come straight from the criterion. The test leaves out the clause saying a second create request is refused with a message, and the reason is real: proposal-cwu-create has no action that sends a create request without going through the start-proposal path, and v2 says that path redirects, so field_error has nothing to report. The file's comment names the gap and the proposal names the surface addition that would close it. R-2.35: the given is built on the seeded Sprint With Us opportunity through steps the surface offers (the scheduled closing trigger, individual and consensus scoring, finalising, a code challenge score, a disqualification). The seed confirms the panel is the government account as evaluator and the administrator as chair and evaluator, so the walk can be done. The history is read by the administrator, which answers the redo note about reading it as the vendor. Each assertion maps to a clause: the state names the test caused (submitted, under review, code challenge, disqualified, all of them the spec's own words), the score it entered (80), the note it wrote, the administrator's name taken from their own profile ('who'), the current year ('when'), and the order from disqualification to code challenge to submission ('newest first'). The check that the administrator's name is not empty only stops the name check from passing vacuously. It claims nothing about the product. No selector, route, table name or status code appears in either test. The runner's typecheck passed. Removing the R-2.35 redo entry and the superseded v1 rulings in applied.yaml matches what earlier approved derive-tests proposals did, and no protected path is touched. The tier is STANDARD, so this does not escalate. This would become a return if either test asserted something its criterion does not state, if the surface turned out to have an action that sends a raw create request (then R-2.2's omission would lack a real reason), or if the history turned out not to be visible to an administrator.

**Conditions:**
- R-2.2 does not test its refusal clause ('a request to create a second one is refused with a message saying they already have one'). The contract stage should take up the proposed action on proposal-cwu-create and its Sprint With Us and Team With Us siblings that sends a create request without being redirected, and a derive-tests run should add the assertion once that action exists.
- R-2.35 asserts only the code challenge score, not the individual and consensus question scores the test also entered, and it reads 'when' and 'newest first' coarsely because history_tab returns the whole history as one block of text. The contract stage should consider the proposed observation that returns history one entry at a time (event, author, time, note) so these checks can be tightened.
- The not-testable entries that rest on 'walking a seeded opportunity through evaluation uses it up' (R-2.27, R-2.29 to R-2.33, R-1.41, R-1.42) no longer hold, because tests/fixtures/index.ts resets the target to its seed before every test. The contract and derive-tests stages should revisit them. This proposal does not change them.

### Runner-owned typecheck evidence

Proposal revision: `11c65973e91872285c545a9131d3494a5a50987e`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/proposals/`, which this proposal answers for.

    No diagnostics.
