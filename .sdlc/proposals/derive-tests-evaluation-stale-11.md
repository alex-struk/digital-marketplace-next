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
