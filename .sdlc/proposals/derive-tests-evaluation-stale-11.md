---
gate: G3
question: "Do these tests follow from the evaluation criteria and from nothing else?"
recommendation: "Both criteria now have tests, and neither still has an entry in `tests/acceptance/not-testable.yaml`."
opened: 2026-09-28T22:45:33.123Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the evaluation criteria and from nothing else?

**Recommendation.** Both criteria now have tests, and neither still has an entry in `tests/acceptance/not-testable.yaml`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Both criteria now have tests, and neither still has an entry in `tests/acceptance/not-testable.yaml`. One thing to know first: I couldn't compile or run either file. TypeScript isn't installed in this workspace, and there is no target to run against. I fixed by hand the one place I expected a type error, but a type error or a wrong reading of an observation's output would only show up at the first real run.

**R-5.3** (an evaluator holds at most one evaluation per proponent, and a second attempt is refused with a message). The old test went through the create screen and could only check the message if the screen happened to show a refusal, so that clause had been left open. The new test uses what the contract added: the request action that starts an evaluation, the observation of whether it was created, and the observation of the refusal message. It runs once for Sprint With Us and once for Team With Us, on the new seeded opportunities where the government staff account already holds a draft of the first proponent. Signed in as that account, it:
- reads the stored scores of the draft already held;
- asks the service to start a second evaluation of that proponent with different scores;
- requires that no evaluation is created and that the refusal message says the evaluator "already has" one;
- requires that the stored scores still read exactly as before;
- makes a first attempt on the second proponent, which must be accepted with no refusal. This shows the first refusal was because an evaluation already existed, not for some other reason.

I checked for the phrase "already have" rather than the exact wording. The contract gives that wording only as what the reference system happens to say, and the criterion asks only for a message saying they already have one.

**R-5.32** (finalising records the agreed scores, screens in the top proponents that met every minimum, and moves the opportunity on). The history clause had been left open because the history could only be read as one block of text. The test now uses the copied opportunities held apart for this criterion and the new observation that reads a proposal's history entry by entry, on the Sprint With Us and Team With Us proposal pages. It now also asserts that:
- before finalising, no proposal has an entry recording its agreed scores;
- afterwards, every proposal, including the ones not screened in, has an entry whose question-by-question scores are exactly its seeded agreed scores.

The earlier checks are unchanged, only pointed at the new opportunities and the new history observation:
- The opportunity's status changes and names the challenge.
- Screening is read by comparing what each proposal's history gained. That still shows at most four for Sprint With Us and three for Team With Us, and that the proponent below a minimum is left out even though it outscores some that are screened in.
- The questions scores follow the order of the agreed totals.

**What's missing:** nothing. Every action, observation and seeded record both tests needed exists in the contract. I didn't change anything under `spec`, `tests/seed`, `tests/fixtures` or the other read-only paths, and nothing asked me to.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the rewritten tests for R-5.3 and R-5.32 follow from their criteria and from nothing else? Ruling: approve. R-5.3: the test starts from a seeded draft the evaluator already holds, asks the service to start a second evaluation of the same proponent, and requires three things: no evaluation is created, the refusal message contains 'already have', and the stored scores still read as before. That covers every clause of the criterion. It matches 'already have' rather than the full sentence because the criterion only asks for a message saying they already have one. It also makes a first attempt on the second proponent and requires that to be accepted. The criterion's 'at most one' implies a first evaluation is allowed, so this check is within it, and it shows the refusal was about the existing evaluation and not something else. The actions and observations it uses (create_evaluation_by_request, evaluation_created, creation_refusal_message, stored_scores) and the seeded proposals it starts from (swu/twuAlreadyBegunEvaluated and swu/twuAlreadyBegunUntouched) are all in spec/contract/surface.yaml and tests/generated/seed.ts. The 'status: DRAFT' in its request body is what the contract says that action sends, so it is not a leak of how the application is built. R-5.32: the test reads the new history_entries observation and requires every proponent, including the ones not screened in, to gain an entry whose question-by-question scores are exactly the seeded agreed_scores. It also requires that no such entry exists before finalising, which is what shows the finalising wrote it. That closes the clause the not-testable.yaml entry left open. The test finds those scores by looking for text of the form 'Qn: score', and it takes that form from the contract's own description of history_entries, not from reading the application. The other checks are unchanged in substance, only pointed at the seeded copies held apart for this criterion: at most four screened in for Sprint With Us and three for Team With Us, the proponent below a minimum left out, the opportunity's status naming the challenge, and the questions scores standing in the order of the agreed totals. The typecheck run on this commit reported no errors in acceptance/evaluation/. Its failure comes from two errors in adapters/new/, which this proposal does not touch. Both not-testable.yaml entries are correctly removed, because each clause they held open is now asserted. The owed missing-test records close when these tests first run at the current version of each criterion, so no condition is needed here. What would change the ruling: a first run showing that history_entries does not give per-question scores in the form the contract describes, or that create_evaluation_by_request does not act on the proposal in its opened route.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `843ce66c18da0fb6cbd56366bd3e6a58cc135a46`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/evaluation/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
