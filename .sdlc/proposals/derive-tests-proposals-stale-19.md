---
gate: G3
question: "Do these tests follow from the proposals criteria and from nothing else?"
recommendation: "R-2.10 now has a test for both the create path and the edit path, and I removed its entry from `tests/acceptance/not-testable.yaml`."
opened: 2026-10-04T07:08:00.673Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the proposals criteria and from nothing else?

**Recommendation.** R-2.10 now has a test for both the create path and the edit path, and I removed its entry from `tests/acceptance/not-testable.yaml`.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

R-2.10 now has a test for both the create path and the edit path, and I removed its entry from `tests/acceptance/not-testable.yaml`. I couldn't type-check or run the file, because the command needed approval that this session doesn't have, so it is unverified.

**What I did.** I re-read `proposal-twu-edit` in the contract. It now has `set_hourly_rate`, which takes a service area and a rate and is sent by `save_changes` or `save_changes_and_submit`. Refusals are read through `field_error` and `submission_refusal`, and the contract notes say a draft saved from `proposal-twu-create` lands on this page, where `proposal_identifier` gives its id. That was everything the old entry said was missing.

In `tests/acceptance/proposals/R-2.10.spec.ts` I kept the existing create-path test and added a second `test()` for the edit path. The edit-path test:
- publishes two Team With Us opportunities with one full-time resource, a two-month contract and a $50,000 maximum budget;
- saves a draft on each at $50 an hour, reads its identifier, and reopens it on `proposal-twu-edit`;
- runs `start_editing`, then `set_hourly_rate`, then `save_changes_and_submit`.

The control draft is raised to $80 and must go through with no refusal, ending up submitted. The other draft is raised to $5,000 and must be refused, through either `submission_refusal` or `field_error`, and must not end up submitted.

**Why it is built this way.** An earlier review flagged a version of this test for storing an over-budget draft before trying the edit path. The criterion doesn't ask for that, so here the stored draft is always within budget and only the edit takes it over. The amounts are far enough apart that the test doesn't depend on how the service counts the contract period. Even counting every calendar day, $80 comes to about $40,000. The existing create-path control of $100 would come to about $49,600 that way, which is close to the $50,000 line; I left it unchanged.

**Results.**
- **Tests:** one criterion is covered (R-2.10), with two tests.
- **Not testable:** no proposals criterion is left recorded as untestable, and no entry names a part of a criterion that a test doesn't check.
- **Missing from the contract:** nothing; every action and observation I needed was there.
- **Files outside this stage:** nothing asked me to change any.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: do the R-2.10 tests follow from the criterion and nothing else? Approved. The new edit-path test asserts the clause 'the check runs on both the create and the edit path'. The contract now offers what the removed not-testable entry said was missing: set_hourly_rate on proposal-twu-edit after start_editing, sent by save_changes_and_submit, with refusals read through field_error or submission_refusal, and proposal_identifier on the page a create-path draft lands on. So removing that entry is justified. The test stores a draft within budget ($50) and only the edit takes it over budget ($5,000), with an $80 control on a second opportunity of the same shape. The over-budget case is therefore caused by the edit and by nothing else. Asserting refusal and 'not submitted' for the over-budget draft, and 'submitted' with no refusal for the control, is what refused or accepted means. No selector, route, status code or storage detail appears. The runner's typecheck passed with no diagnostics under acceptance/proposals. The owed test for R-2.10 closes when this test runs and is not marked met by this ruling. build-slice-15-2#1 (the Sprint With Us reference Company box) is unrelated and stays open. A test asserting something R-2.10 does not state, or a contract action that turned out not to exist, would change this ruling.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `8527fd04492d5703ef28162910f10b6117b62e66`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/proposals/`, which this proposal answers for.

    No diagnostics.
