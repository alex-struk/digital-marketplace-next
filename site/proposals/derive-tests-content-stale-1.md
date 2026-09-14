| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-14T23:31:02.653Z |
| holder | agent:reviewer |

# Do these tests follow from the content criteria and from nothing else?

**Recommendation.** I wrote tests for both content-domain criteria I was given, R-7.20 and R-7.21.

I wrote tests for both content-domain criteria I was given, R-7.20 and R-7.21. Neither is listed in `not-testable.yaml`. I haven't run them, and I couldn't typecheck them either: running the compiler needed an approval this session didn't get. A scan found none of the patterns the separation check refuses (`page.`, locator or selector calls, test ids, navigation, URL- or route-shaped strings). By reading, every surface and seed name used exists in `tests/generated`. Whether they compile, and pass against a target, is still open.

**What I changed and why.** Both files already existed, and both were on the redo list for the same reason. The old tests treated a submission that couldn't go through as a failure. But the criterion is also met when the form refuses before anything is sent. So both files now try to publish (and confirm, if a confirmation appears) without failing when that attempt is blocked. What they check instead is:
- the field's error mark, polled for up to 15 seconds so it has time to appear;
- that nothing was saved, read as a signed-out visitor at the page's address.

The headers now carry spec@1c3743e9 and today's date. Each test title is the criterion's own statement plus a short phrase naming the case.

**R-7.20 (title and body lengths)** has seven tests:
- **Creating a page:** four refusals, one each for an empty title, a body over fifty thousand characters, a title over a hundred characters and an empty body. Each checks the error mark and that nothing is found at the new address afterwards.
- **Changing a page:** two refusals, an empty title and an over-long body, on the seeded ordinary page. The criterion's starting point covers changing a page, not just creating one, and the old file skipped that. Each compares the title or body a visitor reads before and after.
- **At the limits:** a title of exactly a hundred characters with a body of exactly fifty thousand is accepted. This shows the refusals happen where the criterion says they should.

**R-7.21 (address rule)** has six tests: one refusal for each way of breaking the rule the criterion names (a capital letter, a space, an underscore, a leading hyphen, a trailing hyphen), plus one showing a well-formed address is accepted. I dropped the old test that the form states the rule and shows the full public address. That came from a note on the criterion, not from its given/when/then, so it could fail for reasons the criterion doesn't claim.

**What the contract is missing.**
- **Which field is marked.** Both criteria say the refusal names the failing field. The create and edit pages each offer only one catch-all `fieldError` observation, which doesn't say which field it belongs to. The tests work around this by making every other field valid, so the mark can only belong to the one under test. That's a weaker check than the criterion states. Separate observations per field would let a test check it directly: `titleError`, `bodyError` and `slugError` on the create page, and `titleError` and `bodyError` on the edit page. Without them, a service that marks the wrong field would still pass.
- **Where the refusal happened.** A test can't tell a publish the form blocked from one it sent and had refused, except by catching the failed attempt. The create page does declare `publishDisabledUntilValid`, but nothing says whether the form disables publishing at all for these cases, so I didn't depend on it.
- **Names I assumed.** The contract doesn't give argument shapes. I assumed `editTitle({ title })` and `editBody({ body })`, following the create page's `enterTitle({ title })`. If the adapter expects something else, the two edit-page tests will fail for that reason, not because of the service.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Question: do the R-7.20 and R-7.21 tests follow from their criteria and from nothing else? Ruling: approve. R-7.20's given covers creating or changing a page, its when names an empty title and a body over fifty thousand characters, and its then is that nothing is saved and the failing field is marked. The four create-page refusals cover those two cases plus the over-long title and empty body that the statement's own ranges name. The two edit-page refusals cover the 'changing' half of the given. The at-limits acceptance (100-character title, 50,000-character body) is the plain inclusive reading of 'between one and a hundred'. R-7.21's five malformed addresses are its when verbatim, and each test checks its then (the address is marked, no page answers at the address). The well-formed acceptance follows from 'any other address is refused'. Dropping the rule-help and public-address test is correct because it came from the criterion's note, not its given/when/then. The redo reason is fixed: a publish that is withheld no longer fails the test, the field mark is polled, and absence of a saved page is checked as a signed-out visitor. No selector, route, test id, status code or column name appears. Every action and observation used is declared on ContentCreatePage, ContentEditPage or ContentViewPage, seed.content.ordinaryPage exists, and the runner typecheck passed with no diagnostics under acceptance/content. The tests-check warnings concern superseded criteria in other domains. Removing R-7.20 and R-7.21 from redo.yaml and their stale rulings from applied.yaml matches the approved derive-tests-files-stale-1 and touches no protected path. Tier is STANDARD with no unaccepted residual risk, so no escalation. Recorded without holding the gate: the pages expose one undifferentiated fieldError, so 'the failing field named' is shown only by keeping every other field valid, which is a contract gap and not a test fault; the publish helpers swallow every error, so an adapter failure on the way to publish cannot be told from a refusal, though the field-mark and not-saved checks still guard the outcome; and editTitle({ title }) and editBody({ body }) are assumed shapes on an input the contract types as unknown. The ruling would change if the adapter expects a different edit argument shape, or if calibration shows the edit-page tests depend on starting signed out in a way the fixture does not provide.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `ab555495c98657b9862168b6913f773b6fbeb96a`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/content/`, which this proposal answers for.

    No diagnostics.
