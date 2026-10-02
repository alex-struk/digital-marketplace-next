---
gate: G3
question: "Do these tests follow from the opportunities criteria and from nothing else?"
recommendation: "I wrote one test file, `tests/acceptance/opportunities/R-1.20.spec.ts`, for R-1.20, the only criterion handed back this run."
opened: 2026-10-02T16:34:43.253Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** I wrote one test file, `tests/acceptance/opportunities/R-1.20.spec.ts`, for R-1.20, the only criterion handed back this run.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I wrote one test file, `tests/acceptance/opportunities/R-1.20.spec.ts`, for R-1.20, the only criterion handed back this run. It has not been type-checked or run: the workspace refused approval to run `tsc`, and there is no target here to run it against.

**What the test does.** The contract stage added the page `opportunity-status-request` and the seeded record `seed.opportunities.cwuCancelled`, which is what the old entry asked for. With them, the whole criterion can now be reached through the surface. Its one given/when/then is a single `describe` titled with the criterion's statement. Inside it there is one test for each example the criterion gives, and each test title also carries the statement. Every request is made as `persona.administrator`, who may make every change on the permitted path, so a refusal is about the path and not about who asked. The five cases are:
- `seed.opportunities.cwuAwarded` asked to go back to PUBLISHED.
- `seed.opportunities.swuAwarded` asked to go back to PUBLISHED.
- `seed.opportunities.cwuCancelled` asked to go to PUBLISHED.
- A new Sprint With Us draft, saved through `opportunitySwuCreate`, asked to go straight to EVAL_CC (the code challenge).
- A new Team With Us draft, saved through `opportunityTwuCreate`, asked to go straight to EVAL_C (the challenge).

Each draft's identifier is read with `opportunityIdentifier()` on its edit page. I left out a Code With Us draft case because the contract says that program has no operation leading to an evaluation stage at all.

Each case sends `requestStatusChange({ status })` and then checks three things:
- `requestAccepted` reads as not accepted.
- `refusalStatus` is not empty.
- `storedStatus` still equals the status before the request: the seed's `seeded_status` for the seeded records, or, for a draft, a `storedStatus` read just before the request.

**One assumption to watch.** The contract describes `stored_status` as read afresh after the request. The draft cases also read it before the request, which the contract neither promises nor rules out. If an adapter only answers it after a request, those two cases will fail for that reason rather than because of the criterion.

**The not-testable entry.** I removed the R-1.20 entry from `tests/acceptance/not-testable.yaml`, so the criterion now has a test and no entry. I wrote no clause entry, because every clause the criterion states is asserted.

Nothing is missing from the surface for this criterion, and nothing asked me to change paths this stage does not own.
