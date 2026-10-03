| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-03T19:26:34.227Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does slice 13 (An organization can qualify for Sprint With Us and Team With Us) do what its criteria say?

**Recommendation.** This revision changes two decision records and no code.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

This revision changes two decision records and no code. They now agree with each other and with the ruling that returned the slice.

**Decision record 0054** (`docs/decisions/0054-service-area-checkboxes-follow-the-catalogue.md`): I removed the claim that the label and value change fixes the R-3.26 and R-3.28 acceptance failures. The record now gives one reason for the change: the Team With Us service-area form follows the catalogue story `organization-edit · service-areas-editing`. That means kebab-case checkbox values (`full-stack-developer`) and sentence-case labels ("Full stack developer"), turned back into the service's keys only when the form saves. A new paragraph says what actually caused the earlier failures. The new target's test adapter reported every checkbox with its checked state, so every area name was always in the text it returned. That belongs to the adapter, and it has been referred to the stage that binds it.

**Decision record 0053** (`docs/decisions/0053-qualifying-for-sprint-with-us-and-team-with-us.md`): the Service areas paragraph used to say the screen uses the service's own title-case names and that the stories' sentence-case names are only illustrative. It now says the screen names each area in sentence case, as the catalogue does, with kebab-case checkbox values that become the service's keys on save, and it points to 0054.

Before editing, I checked the code against the records. `app/frontend/src/screens/organization-qualification.tsx` maps `FULL_STACK_DEVELOPER` to "Full stack developer", and the frontend unit tests check those labels and the `full-stack-developer` value, so the records now describe what the code does. I left the application as it was. The ruling did not ask for a code change, and it says the code is not the cause.

`npm --prefix app run check` failed at first because `tsc` was missing: the workspace had no `node_modules`. After `npm install` under `app/`, the check passes. It typechecks every package and runs all three unit-test suites: 16, 570 and 384 tests. The one error line in the output is a log about undelivered mail that an existing test triggers on purpose, not a failure.

The ruling's other condition belongs to the adapter-binding stage, and I did not touch it. On the new target, `organizationEdit.serviceAreaCheckbox` (in `tests/adapters/new/index.ts`) must return only the approved service areas, the way the old target's binding does. Until it does, R-3.26 and R-3.28 will keep failing whatever the application does.

Slice 13 still covers all four of its criteria, R-3.25 to R-3.28, as the earlier build of it did. This revision adds nothing the next slice depends on.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Does slice 13 do what R-3.25 to R-3.28 say? Yes. The verify result is a current pass for this proposal (application tree 39e41d8): all four criteria were run against the application and met. The code matches the criteria and goes no further. The service works out each Sprint With Us requirement once, and the tabs only display that answer, so they cannot disagree with the qualified marks (R-3.25, R-3.26). Accepting terms records the moment once and refuses a second attempt with an 'already been accepted' message (R-3.27). Only a service administrator may set service areas, the old approvals are deleted and the new ones written in one transaction, and the owner gets no editing control (R-3.28). Rules, backend end-to-end tests and screen tests cover the new code, and I found no secrets, personal data or credentials. This revision changes two decision records and no code, and it carries out both instructions the previous ruling left owed: 0054 no longer claims the checkbox change fixes the acceptance failures, and 0053's Service areas paragraph now matches 0054 and the code. Two things would change this ruling: a verify result against a later application tree, or a ruling that only the owner, not an administrator, may accept program terms. The backend currently allows an administrator, which 0053 records as a decision.

**Conditions:**
- condition-met build-slice-13-3#2: docs/decisions/0054-service-area-checkboxes-follow-the-catalogue.md no longer claims the label and value change fixes the R-3.26 and R-3.28 failures. It gives following the catalogue story organization-edit · service-areas-editing as the only reason for the change, and its third paragraph attributes the earlier failures to the new target's adapter, which reported every checkbox with its checked state.
- condition-met build-slice-13-3#3: the Service areas paragraph of docs/decisions/0053-qualifying-for-sprint-with-us-and-team-with-us.md now says the screen names each area in sentence case ('Full stack developer') with kebab-case checkbox values that become the service's keys on save, and points to 0054. This matches SENTENCE_CASE and SERVICE_AREA_CHOICES in app/frontend/src/screens/organization-qualification.tsx and the assertions in app/frontend/tests/qualification.test.tsx.
