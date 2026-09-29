| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-29T11:18:15.962Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do these tests follow from the proposals criteria and from nothing else?

**Recommendation.** I wrote one test file for the single criterion I was given, R-2.19 v3.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I wrote one test file for the single criterion I was given, R-2.19 v3. It passes part of the criterion, so it also has a clause entry in `tests/acceptance/not-testable.yaml`. I could not run the type checker or check the YAML: both commands needed approval, and no one was here to give it. The file follows the same imports and patterns as the R-2.18 and R-2.37 tests already in the workspace, but it has not been compiled or run.

**What the test covers.** `tests/acceptance/proposals/R-2.19.spec.ts` replaces the v2 file and now carries the v3 header. It has nine tests. Each is titled with the criterion's statement plus a short note on which outcome it checks. Each test publishes its own Sprint With Us opportunity with two phases: a prototype phase wanting frontend work and an implementation phase wanting backend work, each with its own budget. The seeded qualified organization's administrator holds the frontend capability and its owner the backend one, so one arrangement of people makes a complete proposal. Each refusal test spoils exactly one thing about it.

- **Through the proposal form:**
  - A complete proposal is submitted.
  - A proposal with no team for one phase is refused.
  - Choosing a second scrum master in a phase replaces the first, so the proposal still goes through.
  - Capabilities placed in the wrong phases are refused. Between them the two phases hold every capability, but neither holds its own, which is the per-phase rule v3 added.
  - One phase's cost over that phase's budget is refused.
  - A total cost over the opportunity's total budget is refused.
- **Through `proposal-team-request`:** v3 says the form itself prevents these, so they are sent straight to the service.
  - A phase with two scrum masters is refused.
  - A phase with no scrum master is refused.
  - A phase whose only holder of a required capability is a person with an unanswered invitation, rather than a confirmed member, is refused.

**One risk.** The total-budget test publishes an opportunity whose phase budgets add up to more than its total budget. Nothing in the spec refuses that, and the earlier v2 file assumed it could not be done. If publishing is refused, the test will fail in setup with a message saying the opportunity was not published, not at the criterion's assertion.

**Not asserted (the clause entry, owner `contract`, marked `blocked:`).** The entry names these clauses:
- "to no other phase, the proposal form offering a team section for exactly the opportunity's phases"
- "the form shows which phase is incomplete or which cost is over its budget"

The surface actions and observations I needed but did not find:
- On `proposal-swu-create`, an observation listing the phases the form offers a team section for.
- Error observations that report what each message is about: the phase whose team, scrum master, capabilities or cost is wrong, or the total cost. Today `field_error`, `capability_gap_error` and `budget_exceeded_error` are text with no location. `proposal-swu-edit`'s `field_error` already has this for `save_changes`.
- A statement of what `proposal-team-request` sends for a phase the opportunity does not have. Its input is documented only for the phases the opportunity requires, so a team for an extra phase cannot be sent to the service either.

I changed nothing outside `tests/acceptance`, and nothing asked me to.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether R-2.19.spec.ts asserts R-2.19 v3 and nothing beyond it. Approve. Each of the nine tests asserts only submission or refusal, which is what the criterion states: a complete proposal is submitted; a missing phase team, a missing per-phase capability (both capabilities present across the proposal but each in the wrong phase), a phase cost over its phase budget and a total over the opportunity's total budget are each refused on the form; two scrum masters, no scrum master and reliance on an unconfirmed (pending) holder of a required capability are refused by the service, which is right because the form's single choice keeps a vendor from sending those; and replacing a scrum master shows the single choice. The seed agrees with the test's premises (manifest: organizationAdmin holds Frontend Development, organizationOwner holds Backend Development, organizationMember holds neither, teamCandidatePending is a pending member holding Backend Development). Nothing about how the app is built leaks into the assertions; they use contract observations only. The two unasserted clauses, that the form offers team sections for exactly the opportunity's phases and that the form says which phase or cost is at fault, carry a clause entry in not-testable.yaml owned by contract. Its reason is genuine: proposal-swu-create in spec/contract/surface.yaml offers no observation of phase sections, and field_error, capability_gap_error and budget_exceeded_error are text with no location. The checks already show that clause as missing-test owed by contract. The runner's typecheck reports no diagnostics under acceptance/proposals; the 2 failures are in adapters/new, which this proposal does not answer for. Remaining risk: the total-budget test depends on publishing an opportunity whose phase budgets exceed its total, and it fails loudly in setup if that is refused. A type error in this file, or evidence that the unasserted clauses are reachable with the current surface, would change the ruling to a return.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `dfa537a8c453bee06a48a0d8de7982c0bb1546a3`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/proposals/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
