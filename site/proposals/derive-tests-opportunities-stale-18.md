| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T16:34:43.253Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether the R-1.20 test follows from the criterion and nothing else. It does, so I approve. The criterion says a request off the program's permitted path is refused and the opportunity's state is unchanged. Each of the five cases asserts both: requestAccepted reads false (and refusalStatus is not empty, which is how the contract says a refused request shows, without pinning a code), and storedStatus, read again after the request, equals the status beforehand (the seed's seeded_status, or for a fresh draft the status read just before the request). The cases are the criterion's own examples (awarded Code With Us and Sprint With Us asked back to PUBLISHED, cancelled Code With Us asked to PUBLISHED, Sprint With Us and Team With Us drafts asked straight to EVAL_CC and EVAL_C). They match the starting points the contract gives on the opportunity-status-request page. The status values are contract and seed vocabulary, not implementation detail. Leaving out a Code With Us draft case follows the contract's statement that the program has no operation leading to an evaluation stage. The writer flagged an assumption: the draft cases read stored_status before any request. That holds, because both adapters read it fresh from the opened opportunity whether or not a request has been sent. Removing the not-testable entry is right, since the page and seed.opportunities.cwuCancelled it asked for now exist and every clause is asserted, so no clause entry is owed. The runner's typecheck of the proposal checkout passed with no diagnostics. missing-test/R-1.20 stays open until the test runs, which a ruling cannot settle, and build-slice-9-3#6 is not touched by this proposal. A run showing the page unbound, or a new criterion version, would change this ruling.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `af6acad981b1f76bfbbbad69deca2a8b64b10b99`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    No diagnostics.
