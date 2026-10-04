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
