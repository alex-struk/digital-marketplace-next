| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-28T19:26:10.857Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.282 (Claude Code)) |

# Do the revised opportunities tests now follow from their criteria and from nothing else?

**Recommendation.** I made both changes the reviewer asked for, and both are in `tests/acceptance/opportunities/R-1.16.spec.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I made both changes the reviewer asked for, and both are in `tests/acceptance/opportunities/R-1.16.spec.ts`. I could not run the typecheck: running the compiler needed an approval that nobody was here to give. I read the edited code by hand instead, and every call it makes is declared in `tests/generated/surface.d.ts`.

**Condition 1: the inception-without-prototype test.** It used to accept any validation error. Now it reads the submission's field error and requires it to mention both "prototype" and "inception", ignoring case. It then checks that the opportunity did not end up published, in one of two ways:
- If the submission left the administrator on an edit page with an identifier, the test opens that opportunity's view page and requires that its status does not say "published".
- If there is no identifier, the test opens the dashboard and requires that the administrator's own opportunities table does not list the opportunity's title.

I gave the title a variable so the same string is used for both the submission and that check. As the reviewer said, this replaces the earlier instruction to keep this test as written.

**Condition 2: the implementation-phase test.** The old helper returned an empty string whenever any read failed. I replaced it with one that catches a failure only when reading the opportunity identifier. That failure is expected, because someone turned away from the create page never reaches an edit page. The dashboard table is now read with nothing catching errors, so a dashboard that cannot be read fails the test instead of passing on an empty string. The second test uses the same helper, so its dashboard read cannot fail silently either.

I also updated the file's opening comment to describe the new checks. The header's "derived 2026-09-28" date stays as it was: that is today's date, and the content really did change.

Nothing else changed. The other three opportunities tests (R-1.29, R-1.27, R-1.9) and every entry in `tests/acceptance/not-testable.yaml`, including R-1.9's partial entry, are exactly as I found them. R-1.16 needs no not-testable entry: the field error returns its text, so the rejection message itself can now be asserted. There were no conditions I could not act on, and I needed no surface action or observation beyond what the contract already declares.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

The question is whether the revised R-1.16 tests now follow from their criterion and from nothing else, and whether they carry out the two instructions left by derive-tests-opportunities-stale-6. Approved. The inception-without-prototype test now requires the rejection message to name both prototype and inception, and checks that the opportunity did not end up published (its status on the view page when an identifier exists, otherwise its absence from the administrator's dashboard table). Both follow from the criterion's 'the submission is rejected with a message saying a prototype phase must follow an inception phase', which settles #1. The implementation-phase test catches a failure only when reading the landed opportunity's identifier, which is expected because a person turned away from the create page reaches no edit page. The dashboard read is not caught, so an unreadable dashboard fails the test rather than passing on an empty string, which settles #2. No assertion reaches past the criterion or depends on how the application is built. The runner's typecheck reports no errors under acceptance/opportunities; its failure comes from 2 errors under adapters/new, outside this proposal. The rest of the diff against main (R-1.27, R-1.29, R-1.9 and R-1.9's not-testable entry) was not the subject of the earlier return, and it reads as following from those criteria: R-1.29 asserts only the withholding its v2 states, and R-1.9's partial coverage is recorded by a clause-bearing entry that names contract as the owing stage, already shown as open in the checks. The ruling would change on evidence that the Sprint With Us view shows a status like 'Unpublished' for a state that is not published, which would fail the second test wrongly, or on typecheck errors appearing under acceptance/opportunities.

**Conditions:**
- condition-met derive-tests-opportunities-stale-6#1: the inception-without-prototype test in tests/acceptance/opportunities/R-1.16.spec.ts now asserts field_error matches both /prototype/i and /inception/i, then asserts the opportunity is not published (view status not /published/i when an identifier was reached, otherwise its title absent from the dashboard's own-opportunities table)
- condition-met derive-tests-opportunities-stale-6#2: in tests/acceptance/opportunities/R-1.16.spec.ts only the opportunity-identifier read is wrapped (landedOpportunityId); the dashboard open and myOpportunitiesTable read are uncaught, so a dashboard that cannot be read fails the test instead of passing on an empty string

### Runner-owned typecheck evidence

Proposal revision: `0687bf093bfac781784ba6741f40290ec8590d85`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
