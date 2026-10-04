---
gate: G3
question: "Do these tests follow from the proposals criteria and from nothing else?"
recommendation: "I wrote one test for the one criterion, R-2.10."
opened: 2026-10-04T06:47:45.588Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the proposals criteria and from nothing else?

**Recommendation.** I wrote one test for the one criterion, R-2.10.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I wrote one test for the one criterion, R-2.10. It covers the create path only. The edit-path clause now has a clause-scoped `blocked:` entry in `tests/acceptance/not-testable.yaml`, owned by `contract`. Nothing was compiled or run: the commands to type-check the file and parse the YAML both needed approval, and neither was given.

**Why the old edit-path test is gone.** The ruling said it stored an over-budget Team With Us proposal as a draft before trying the edit path. The criterion doesn't ask for that. To do it properly, the test has to start from a proposal saved within budget and then raise its hourly rate past the opportunity's maximum. The contract offers no way to make that change:
- The Team With Us proposal management screen (`proposalTwuEdit`) can start editing, change the organization, add a team member, save, save and submit, submit, withdraw and delete. It has no hourly-rate control. A comment in `surface.yaml` says the create screen's controls open once editing starts, but the declared actions don't include setting the rate.
- The team proposal request (`proposalTeamRequest`) only creates and submits a new proposal in one go. It has no update.
- Nothing else edits a stored proposal's rates.

I also considered lowering the opportunity's budget after the proposal was saved. I rejected it because the ruling says the proposal itself has to be edited over budget, and that route would add a step the criterion never asks for. So I deleted the edit-path test rather than rewrite it.

**What the remaining test does.** It publishes two identical opportunities, each with one full-time resource, a two-month contract and a $50,000 maximum budget. On one, a proposal at $100 an hour is submitted and accepted. On the other, a proposal at $5,000 an hour is refused with a field error. The rates are far enough apart that the test doesn't depend on how the service counts working days, and the $100 proposal acts as a control so the rate is the only thing that changes. This test body is unchanged from the previous version. I only updated the header to spec@658792c3 / derived 2026-10-04 and rewrote the explanatory comment.

**Clause entry for R-2.10.** It names the clause "the check runs on both the create and the edit path", for the edit-path half. It is blocked, owned by `contract`. That half could be tested with either of these, which is what the contract needs to add:
- **Preferred:** a `set_hourly_rate` action on `proposal-twu-edit`, available once editing has started, taking the resource and the rate the way the create screen's action does. The page's existing `field_error` and `submission_refusal` observations would then read the refusal.
- **Alternatively:** an update action on `proposal-team-request` that sends new hourly rates for an existing proposal by its identifier, with its refusal observations.

I changed no files outside `tests/acceptance`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Should the derive-tests-proposals-stale-18 tests be accepted as following from R-2.10 and nothing else? Approve. The one remaining test checks only what R-2.10 says on the create path. It uses two opportunities of the same shape: the $100-an-hour proposal is a control and is accepted, and the $5,000-an-hour proposal is refused with a field error. The rates are far enough apart that the test does not depend on how the service counts working days, and no implementation detail leaks in. The returned edit-path test, which saved an over-budget draft that the criterion never asks for, is deleted. Its clause ('the check runs on both the create and the edit path') is recorded in not-testable.yaml as a clause-scoped blocked entry owned by contract. The reason checks out against spec/contract/surface.yaml: proposal-twu-edit declares no set_hourly_rate action, and proposal-team-request only creates and submits a new proposal. So the edit-path half stays owed and is not silently closed by this test passing; the checks already list it as missing-test/R-2.10 owed by contract. The typecheck run by the runner passes. The removal of R-2.10's old calibrate-triage ruling from tests/results/old/applied.yaml is housekeeping for the replaced test. build-slice-15-2#1 is unrelated and stays open. The ruling would change if the contract offered an edit path the test could reach, or if the create-path assertions went beyond the criterion.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `16fc3d31068299263ef62a6459515ae450d6c04e`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/proposals/`, which this proposal answers for.

    No diagnostics.
