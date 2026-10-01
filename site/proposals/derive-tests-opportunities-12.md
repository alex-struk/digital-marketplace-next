| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-01T14:02:37.234Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do the revised opportunities tests now follow from their criteria and from nothing else?

**Recommendation.** I acted on the one condition.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I acted on the one condition. R-1.6 now also tests a signed-in visitor who is not staff. I couldn't run the typecheck: the command needed approval and nobody was there to give it.

**Condition 1 (R-1.6, the signed-in half of "anyone, signed in or not").** I changed only `tests/acceptance/opportunities/R-1.6.spec.ts`. The anonymous case is unchanged: an administrator reads the view count on the opportunity-counters page and signs out, an anonymous visitor opens `opportunityCwuView`, and the count must have risen by exactly one. After that, the test now signs in as `persona.vendor`, opens the same public page, checks that it really opened by reading the opportunity's identifier, and signs out. The administrator then reads the count again, and the test requires it to have risen by exactly one more.

I checked `tests/generated/personas.ts` first. The vendor persona can be signed in as (session route `/auth/createsessionvendor/1`), it is not staff, and its abilities include viewing a published opportunity. So the surface does reach this clause, and I added no `not-testable.yaml` entry for R-1.6. There was none there before either.

Both viewings sit in the single existing `test()`, under the criterion's own title. The criterion has only one given/when/then, and Playwright refuses two tests with the same title in one file. I updated the explanatory comment to describe both viewings. The header is unchanged: the "derived" date was already 2026-10-01, which is today.

**Not verified.** The typecheck (`tsc --noEmit`) was not run. As a substitute, I confirmed the new code only uses calls the file already used (`surface.signIn`, `surface.signOut`, `opportunityCwuView.open`, `opportunityIdentifier`) plus the `persona.vendor` key, which exists in the generated personas. A later stage should still run the typecheck.

No other file under `tests/acceptance/opportunities/` and no entry in `tests/acceptance/not-testable.yaml` was touched. I wrote nothing outside the paths this stage delivers, and nothing new is missing from the contract surface.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the revised opportunities tests now follow from their criteria and nothing else? Approve. R-1.6 says any visitor, signed in or not, opening an opportunity's public page raises its recorded view count by one. The revised test keeps the anonymous viewing, which must raise the count read on opportunity-counters by exactly one. It adds a viewing by persona.vendor, a signed-in persona who is not staff, which must raise it by exactly one more. That asserts both halves of the criterion's 'when' and its 'then'. The other checks are an identifier read confirming the public page opened and an integer check on the first reading. Both are preconditions of the criterion's own given/when, not new claims. The test uses no selectors, routes or storage names. The not-testable entry for R-1.6 was removed correctly, because the opportunity-counters surface page it asked for now exists and the test uses it. The runner's typecheck on this revision passed with no diagnostics. The test now carries out the earlier condition. missing-test/R-1.6 stays open until a run of this test is recorded, which is correct, so it is not withdrawn. The ruling would change if a run showed opportunity-counters cannot be bound, or that reading it changes the count.

**Conditions:**
- condition-met derive-tests-opportunities-stale-15#1: tests/acceptance/opportunities/R-1.6.spec.ts now adds a signed-in, non-staff viewing (persona.vendor signs in, opens opportunityCwuView, signs out) between two administrator reads of opportunity-counters and asserts an increase of exactly one, while keeping the anonymous viewing and its own exactly-one assertion

### Runner-owned typecheck evidence

Proposal revision: `615e07400372927b658cdba748492b90d6337d2c`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    No diagnostics.
