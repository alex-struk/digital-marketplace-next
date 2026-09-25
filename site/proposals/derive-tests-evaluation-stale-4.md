| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-25T11:50:36.353Z |
| holder | agent:reviewer |

# Do these tests follow from the evaluation criteria and from nothing else?

**Recommendation.** I wrote a test for R-5.9 (v1).

I wrote a test for R-5.9 (v1). It was the only criterion in this run, so one of one now has a test. Its entry is gone from `tests/acceptance/not-testable.yaml`, so the criterion is on the test side only. I couldn't typecheck or run the test: the type-checker command needed approval that wasn't given in this session. The test copies the calls of the existing R-5.37 test, which uses the same request page.

**What changed.** The entry for R-5.9 was blocked because only the browser form could submit a panel, and the form already refuses one with no chair, so any refusal seen there came from the form. The contract has now added the two missing pieces to `evaluation-panel-request`:
- `submit_panel_with_no_chair`: sends two public sector members, both evaluators and neither the chair, straight to the service.
- `missing_chair_error`: the service's refusal.

It already had `panel_as_stored`, which shows the panel the service holds. Together these are everything the entry said was missing.

**What the test does.** It is `tests/acceptance/evaluation/R-5.9.spec.ts`, one `test()` titled with the criterion's own statement, because the criterion has a single outcome:
1. Signs in as `persona.publicSectorStaff` and saves a new Sprint With Us draft, so its panel can still be changed. It gets the draft's identifier from `opportunitySwuEdit.opportunityIdentifier()`.
2. Opens the request page for that opportunity and records `panelAsStored()` as it stands.
3. Submits a panel of `seed.users.staffOne` and `seed.users.staffTwo`, with nobody as chair.
4. Waits for `missingChairError()` to have text and checks that the text mentions "chair".
5. Opens the page again and checks that `panelAsStored()` is exactly what it was before.

I read "reject" as both a refusal and nothing stored, because the criterion is about no opportunity reaching consensus without a chair.

Two assumptions could fail when the test runs:
- **The action's input.** The contract describes it only as "two public sector members (seed users handles)". I passed them as `{ members: [...] }`, the nearest form to R-5.37, which passes `{ member }` to its sibling action. If the adapter expects another shape, the test will fail on that call, not on the requirement.
- **The wording check.** Checking that the refusal says "chair" is my reading of "the service's refusal naming the missing chair" in the contract's own note. The contract doesn't fix any wording beyond that.

**What stays open.** I found no surface action or observation missing for this criterion. I covered only Sprint With Us. The criterion talks about "an evaluation panel" in general, and the request page also accepts `team-with-us`, so a Team With Us version could be added if the ruling wants both programs.

I changed nothing outside `tests/acceptance`.

## Ruling

**Verdict:** return
**By:** agent:reviewer

Question: does tests/acceptance/evaluation/R-5.9.spec.ts follow from R-5.9 and nothing else? Ruling: return. The test sends a chairless panel to the service through evaluation-panel-request.submit_panel_with_no_chair, not through the browser form, so any refusal it reads is the service's own. It reads 'reject' as a refusal being reported (missing_chair_error has text) plus the stored panel being unchanged on reopening (panel_as_stored equals its earlier reading). R-5.9's purpose, that no opportunity reaches consensus without a chair, supports that reading. The test uses only surface calls, personas and seed handles, and the runner's typecheck reports no diagnostics under acceptance/evaluation (its one diagnostic is in adapters/new). Removing R-5.9 from not-testable.yaml is justified because the contract now carries the action and observation that entry named as missing. One assertion goes past the criterion: expect(missingChairError().toLowerCase()).toContain('chair') sets a rule about the refusal's wording. R-5.9 only requires that the service reject the panel. The word comes from the contract's description of the observation, not from the criterion, unlike R-5.37, which explicitly requires a message identifying the offending member. A new service that refuses the panel with other wording would meet R-5.9 and still fail this test. Would approve once that assertion is removed and the other two checks are kept unchanged. Covering Sprint With Us alone is enough, since the criterion states one rule for any evaluation panel. missing-test/R-5.9 stays open until the test runs.

**Conditions:**
- tests/acceptance/evaluation/R-5.9.spec.ts: remove the assertion that the refusal's text contains 'chair'. R-5.9 requires only that the service reject a panel naming no chair; it says nothing about the refusal's wording, so the test may check only that missing_chair_error reports a refusal (has text) and that panel_as_stored is unchanged after reopening the request page. Keep both of those checks as they are.

### Runner-owned typecheck evidence

Proposal revision: `a45b6ed5f610e2f42b161a793876a7598b6a430c`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/evaluation/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 1 diagnostic
