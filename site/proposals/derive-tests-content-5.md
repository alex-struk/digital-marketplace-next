| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-15T02:03:34.308Z |
| holder | agent:reviewer |

# Do the revised content tests now follow from their criteria and from nothing else?

**Recommendation.** I removed the reused-address step from R-7.9 and changed nothing else, so the content domain is ready to go back for review.

I removed the reused-address step from R-7.9 and changed nothing else, so the content domain is ready to go back for review.

**Condition 1: the new page at the freed address.** R-7.9 no longer publishes a new page at the removed page's address, opens it, or reads its `versionHistory`. The reviewer was right: R-7.9 never says a removed address can be used again. A target that keeps removed addresses reserved would pass the criterion but fail that step. The unused wording and the creation calls went with it. The rest of the file is as it was:
- It still publishes one change before removing the page, so it holds both an older wording and the current one.
- It checks the removal message, the return to the list, and that the list no longer shows the address.
- It signs out, opens the address, and checks that it answers as not found and shows neither wording.

**Condition 2: the comment.** The file's comment now says that "no version of its text survives anywhere in the service" is not asserted. The reason given is that no reading in the surface shows a removed page's text. Also, R-7.23 says nothing in the service shows an earlier version. So nothing we can observe could tell erased history from history that is simply never shown. The header keeps the same spec revision and the date 2026-09-15, which is today's date on the machine clock.

**Condition 3: R-7.12, R-7.22, R-7.25 and R-7.27.** I did not touch these four files. I also left the other content tests and every entry in `tests/acceptance/not-testable.yaml` unchanged. R-7.9 has no entry there, so it has a test file and no conflicting not-testable entry.

**Not checked:** I could not compile the edited file, because running the type-checker needed a permission that wasn't given. The risk is small: I only deleted calls, and every remaining call is one the reviewer already saw in the returned version.

No condition was left undone. No surface action or observation is missing for this round. R-7.9's "no version survives" clause stays unasserted for the reasons above. That is a limit of what the service shows, not a missing piece of the contract.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Question: do the revised content tests now test only what their criteria say? Ruling: approve. Compared with the returned version (returned/derive-tests-content-stale-2), R-7.9 is the only test file that changed, and it changed in exactly the two ways the last ruling asked for. The step that created a new page at the removed page's address and read its version history is gone. The file's comment now says 'no version of its text survives anywhere in the service' is not checked, because nothing in the surface shows a removed page's text and R-7.23 says nothing shows an earlier version. What R-7.9 still checks follows from its given, when and then: it uses the seeded ordinary page, which the seed records as having three versions, and publishes one more change; it waits for the removal message; it confirms the return to a list that no longer shows the address; and, signed out, it confirms the address answers as not found and shows neither wording. No selector, route, status code or column name appears, and every action and reading used is declared in tests/generated/surface.d.ts. R-7.12, R-7.22, R-7.25 and R-7.27 are the same as the version already found to need no changes, and persona.administratorOther exists in tests/generated/personas.ts. not-testable.yaml differs from main only in order: the seven content entries moved to the end, and the 60 lines removed match the 60 lines added exactly. The runner's type-check on this revision passed with no errors under acceptance/content, which covers the check the writer could not run. All checks are green; the warnings are about outdated tests in other domains. No protected path is touched, and the tier is STANDARD with no unaccepted risk, so this is not escalated. What would change the ruling: a calibration run showing the product gives no not-found answer at a removed page's address, or showing bodyBeingEdited comes back empty on the edit screen, since R-7.9's last check would then pass without proving anything.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `2989774330c56115651b94866fbaa7f1fd81c4fe`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/content/`, which this proposal answers for.

    No diagnostics.
