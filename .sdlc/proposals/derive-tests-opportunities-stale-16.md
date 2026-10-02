---
gate: G3
question: "Do these tests follow from the opportunities criteria and from nothing else?"
recommendation: "I rewrote both tests."
opened: 2026-10-02T10:51:38.233Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** I rewrote both tests.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote both tests. Neither one now reads a vendor's own proposal listing, which is what the ruling objected to. I couldn't run a type check or the tests: the permission layer refused the `tsc` command. I checked the files by hand against the generated surface, seed and personas, so they are unrun.

**Where the ruling's problem was.** Both earlier versions set up the starting condition and then checked it by having the vendor open their own dashboard and find the submitted proposal under "My Proposals". The criterion never asks for that. The new versions create the starting condition and check nothing about it:
- the signed-in vendor (`persona.vendor`, seed user `vendorOne`) submits a proposal through `surface.proposalCwuCreate` against `seed.opportunities.publishedCodeWithUs`;
- the competing vendor (`proponentTwo`) watches the opportunity through `surface.opportunityWatchRequest.watchByRequest`. That action never switches a watch off, unlike the old `toggleWatch`.

The old tests also counted watchers on the administrator's reporting tab and checked the opportunity's status. I removed both checks, because neither is part of the criterion. The harness now resets the target to the seed before every test, so the seeded published opportunity starts with no proposals and no watchers. That made the old guards for a proposal already being there unnecessary.

**R-1.35** has two tests, one for each way the criterion can be triggered: an administrator edits the opportunity, or adds an addendum. Each test empties the mail catcher, makes the change, and then reads every caught message addressed to one of the three people or to the service's own sending address. A person counts as notified when a message names them as a recipient, either in To or in the blind copies. The test waits until all three are reached, then asserts each was reached exactly once, since the criterion says "each notified once". The old test did not assert "once".

The criterion's note says nobody is notified while the opportunity is a draft or cancelled. That is a note, not the outcome being tested, so I added no test for it.

**R-1.36** has two tests, one for each part of the outcome:
- **Watcher and proponent:** each must be a recipient (To or blind copy) of a message that names the opportunity's title and mentions cancellation.
- **Author:** must receive a message addressed to them in To that names the opportunity's title.

Both criteria got test files, and nothing went into `not-testable.yaml`. I needed no action or observation that the contract lacks. I changed only these two files under `tests/acceptance/opportunities/`.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Do the opportunities tests follow from R-1.35 and R-1.36 and from nothing else? Returned. The rewrite removes what the last ruling objected to: neither test reads the vendor's own proposal listing, the reported watcher count or the opportunity's status. Each now only sets up the given (a submitted proposal and a watch request against the seeded published opportunity) and asserts the then. R-1.35 is sound. Editing and adding an addendum each have a test, and each asserts that the watcher, the proponent and the author are reached exactly once, which is what 'each notified once' says. The statement's draft/cancelled restriction only limits which opportunities the rule covers and states no outcome of its own. Nothing leaks how the application is built: the service sending address comes from the contract's email notes. R-1.36's watcher-and-proponent test asserts both halves of 'told it has been cancelled': the opportunity's title and a mention of cancellation. The author test asserts only a message visibly addressed to the author that names the title. It never asserts the clause 'that the cancellation was actioned', so any later message naming the opportunity would satisfy it, for example a delayed notice about the proposal submitted during setup. The writer could assert this exactly as the sibling test does, so under the brief it is a return, not an approval note. The runner's typecheck passed. Approval would follow once the author test also requires the message to be about the cancellation.

**Conditions:**
- tests/acceptance/opportunities/R-1.36.spec.ts, the test '— its author is told separately that the cancellation was actioned': the clause 'that the cancellation was actioned' is not asserted. The author's message is matched only by visible addressing and the opportunity's title. Also require that its subject or body mentions the cancellation, the same check the watcher-and-proponent test makes, so that a message to the author naming the opportunity for some other reason cannot satisfy it.

### Runner-owned typecheck evidence

Proposal revision: `1c731ebbffd2da04b072b0741ac5756950a6551d`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    No diagnostics.
