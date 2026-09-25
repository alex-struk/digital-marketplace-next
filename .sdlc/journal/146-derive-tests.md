---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-25T11:50:36.326Z"
cost: 0.41407000000000005
turns: 10
session: "7c48e411-85cf-4998-b0bb-08589bcc1972"
---

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