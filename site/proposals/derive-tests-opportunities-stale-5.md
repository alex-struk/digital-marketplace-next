| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-28T16:11:34.221Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.282 (Claude Code)) |

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** I rewrote the test for the one criterion in this batch, R-1.27, at `tests/acceptance/opportunities/R-1.27.spec.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I rewrote the test for the one criterion in this batch, R-1.27, at `tests/acceptance/opportunities/R-1.27.spec.ts`. I left `not-testable.yaml` unchanged. I couldn't typecheck or run the test: this workspace has no TypeScript or Playwright install and no target. I checked every page, observation and seed handle it uses against `surface.d.ts` and `seed.ts` by hand.

**What the ruling found wrong, and what changed:**
- **How the award is established.** The old test waited for the status to read "awarded". The new test never reads the status. It opens the opportunity and waits until `successfulProponent()` names the seeded winner, `seed.organizations.qualified.legal_name`. Being named is the proof of the award, so a system that shows a different word for that state still passes.
- **Where the permitted reader looks.** The reader is signed in as `persona.administrator`, who can award opportunities. The score may now be shown either on the opportunity (`successfulProponentScore()`) or on the winning proposal's own page. On that page the test reads `proposalCwuView.score()` for Code With Us and `proposalSwuView.totalScore()` for Sprint With Us, using `seed.proposals.cwuAwardedWinner` and `seed.proposals.swuAwardedWinner`. It no longer insists on one place. The contact details come from `successfulProponentContactDetails()` on the opportunity, because no other observation in the contract reports them.
- **What the visitor must not see.** A visitor who isn't signed in must still see the winner's name. They must see neither contact details nor score on the opportunity, and no score on the winning proposal's page either. A proposal page that turns the visitor away counts as showing nothing.

**Tests written:** both halves of the criterion's statement, run for each seeded awarded opportunity (Code With Us and Sprint With Us), making four `test()` calls. The criterion's own given/when/then covers only the visitor half, but its statement also makes the claim about permitted readers, so that half gets its own test. Each test is titled with the criterion's statement plus the program and the kind of reader.

**Gaps the contract could close:**
- **Contact details have one observation only.** Contact details are asserted only on the opportunity's view page. If the application shows them to an administrator somewhere else, such as on the proposal page, this test would fail even though the criterion is met. The contract should add a contact-details observation on `proposal-cwu-view` and `proposal-swu-view` if they are shown there. I didn't write a `not-testable.yaml` entry for this, because the test does assert the clause through the one place the contract names.
- **The seed has no contact-details values.** The contact details exist only in the SQL, not in the generated seed, so the test can only check that some contact details appear, not that they are the winner's. Adding the winning organization's contact details to the seed would let the contract's owner make that check exact.
- **No Team With Us awarded opportunity is seeded,** so that program isn't exercised. The criterion doesn't name programs, so I didn't record this as a gap.

I changed no file outside `tests/acceptance`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

Question: does the rewritten R-1.27 test follow from the criterion and nothing else? Approve. The test no longer takes the status label 'awarded' as proof of the award. It establishes the award by the successful proponent being named, which is what the criterion states. The visitor half (the criterion's given/when/then) asserts, for both seeded awarded opportunities, that the winner's name is shown and that contact details and score are withheld on the opportunity and on the winning proposal. A refused proposal page counts as withheld. The permitted-reader half, taken from the statement, asserts that an administrator sees the name and contact details and sees the score on either the opportunity or the proposal page, since the criterion does not say where. Every page, observation and seed handle used exists in surface.d.ts and seed.ts. No selector, route or status wording leaks in. The runner's typecheck reports no diagnostics under acceptance/opportunities; its two diagnostics are in adapters/new, which this proposal does not answer for. The named gaps (contact details readable only on the opportunity page, no contact-detail values in the seed) do not leave any clause unasserted. What would change the ruling: a calibrate run showing the proposal-page score read binding to something other than the score, or a contract change adding a contact-details observation on proposal views, which the test would then need to read.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `fcbaab6878634bbd2bde1df3548ce00782bf8136`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
