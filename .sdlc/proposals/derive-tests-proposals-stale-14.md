---
gate: G3
question: "Do these tests follow from the proposals criteria and from nothing else?"
recommendation: "I wrote one test file for the single criterion I was given, R-2.19 v3."
opened: 2026-09-29T11:18:15.962Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

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
