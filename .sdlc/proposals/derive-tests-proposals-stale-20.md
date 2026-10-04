---
gate: G3
question: "Do these tests follow from the proposals criteria and from nothing else?"
recommendation: "I rewrote the test for R-2.36 (v1) in `tests/acceptance/proposals/R-2.36.spec.ts`."
opened: 2026-10-04T15:19:43.609Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the proposals criteria and from nothing else?

**Recommendation.** I rewrote the test for R-2.36 (v1) in `tests/acceptance/proposals/R-2.36.spec.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I rewrote the test for R-2.36 (v1) in `tests/acceptance/proposals/R-2.36.spec.ts`. It is the only criterion in this run, so one criterion has a test and nothing went to `not-testable.yaml`. I didn't run it, and didn't type-check it either: there is no target here and no TypeScript compiler installed in the workspace.

**What the ruling asked for.** The old test looked for the administrators' withdrawal notice by their address on the visible To line. The new withdrawal test finds that notice through the service's own address, `donotreply@example.test`, which is the sender address named in `observables.yaml`. It opens each message sent there through `surface.caughtMessage` and requires both seeded administrators, `seed.users.administratorOne` and `administratorTwo`, to be on its blind-copy list. As the ruling asked, the vendor's own withdrawal notice is still found by its To line because it has one recipient.

**What changed beyond the ruling.** The old test had two tests: submission and withdrawal. It skipped the award clause because it believed the surface could not carry a proposal as far as an award. It left no `not-testable.yaml` entry for that clause, so a passing run would have counted as the whole criterion met. The seed now has a Code With Us opportunity already in processing, `seed.opportunities.cwuInProcessing`, with two evaluated proposals. `surface.proposalCwuView.awardProposal()` awards one of them directly. So the file now has three tests, one for each act, each titled with the criterion's statement and a suffix naming the act:

- **Submitting:** an administrator publishes an opportunity and the vendor submits a proposal to it. The vendor's confirmation is found by its To line.
- **Awarding:** the administrator awards the organization owner's proposal. The decision notice may go to several people as blind copies, so each proponent's messages are found both by their own address and through the service's address, then opened. A message counts only if that proponent is a visible or blind-copied recipient. The winner must get a notice that reaches no other proponent, and the other proponent must be reached.
- **Withdrawing:** as described above.

**What the tests don't check.** None of them checks message wording, subject lines or links, because the criterion only says who is notified.

**Unchanged from the old test.** In the withdrawal test, `withdrawProposal()` is called on the edit page straight after `submitProposal()`, as the old test did. The ruling didn't question that step, but if submitting does not land the vendor on the edit page, that is the first place to look.

**Missing from the surface.** I found no surface action or observation that I needed and could not reach.

**Outside this stage.** Nothing asked me to change paths outside `tests/acceptance` or `tests/generated`, and I touched none.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: do the R-2.36 tests follow from the criterion and from nothing else? Ruling: approve. All five clauses are asserted, one test per act. (1) Submitting: the vendor's confirmation is found by its To line. (2) Awarding: the winner must be reached by a notice that reaches no other proponent, and every other proponent must be reached, so the award notice and the decision notice are told apart without reading their wording. (3) Withdrawing: the vendor's notice is found by its To line, and every seeded administrator must be on the blind-copy list of the notice sent to the service's own address. That last check is what the earlier test-overreaches ruling asked for. It rests on the blind-copy observation in spec/contract/observables.yaml and on R-6.15, not on anything about how the app is built. No assertion touches wording, subject lines, links, selectors, routes or status codes. The award test uses an opportunity with two proponents where the criterion's given has three. That is a smaller instance of 'everyone else', not a different claim. The award clause, which the old test skipped without a not-testable entry, is now asserted against seed data that exists (opportunities.cwuInProcessing with two EVALUATED proposals in tests/seed/manifest.yaml). The runner's typecheck on this revision passed with no diagnostics. I would return the proposal if a run showed the seeded opportunity can't be awarded because R-1.26 awarded it first. That would make the award test depend on shared seed state.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `3feb771a810eaa5f1b1a63c708eaa96f90a2882c`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/proposals/`, which this proposal answers for.

    No diagnostics.
