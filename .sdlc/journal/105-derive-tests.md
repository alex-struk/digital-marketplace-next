---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-15T05:23:25.166Z"
cost: 3.1635735
turns: 39
session: "7713a7d9-6588-4eea-b93b-729142a76d27"
---

All six criteria in the evaluation domain now have a test file, and nothing went into `tests/acceptance/not-testable.yaml`. None of the files has been run, and none has been typechecked: `tests/` has no installed dependencies, so `tsc` isn't available. I checked the types by reading them against `tsconfig.json` and `generated/surface.d.ts`. I also searched the six files for everything the separation check refuses (selectors, locators, routes, `page.`), comments included, and found nothing.

Every one of the six already had a file from an earlier derivation. Five of them had notes in `redo.yaml` saying what was wrong, so I rewrote all six under the new spec commit and dealt with each note.

**What changed and why**

- **R-5.1 (four tests):** the old tests added people to a new draft's panel, but a new draft already names its creator as chair. So they built valid panels and nothing was refused. Each test now turns that starting panel into exactly the faulty one the criterion describes: one person, the same person twice, two chairs, or a vendor.
  - **Refused means:** the save or the building of the panel fails (actions give up after 15 seconds instead of hanging), or the page shows the error for that rule. After that, opening the panel again must read the same as before.
  - **Duplicate member:** this case still has to show its named error, as the redo note asked.
  - **Two chairs:** no observation names that rule, so this test relies only on the panel being unchanged.
  - **Program:** only Sprint With Us is tested.
- **R-5.9 (one test):** the panel offered to the service is now truly chairless: two other public sector employees are added and the creator, the only chair, is removed. Refused means the save fails or the missing-chair error shows, and the panel must read the same afterwards. A blind test can't tell the service refusing from the browser form refusing, because every save goes through the form.
- **R-5.19 (three tests):**
  - **Opening:** the panel member proves they opened the draft by its identifier and by its "created by" name matching what the administrator saw. The status label is no longer used.
  - **Listing:** the draft must appear in the dashboard's panel list, and the Evaluations tab must be there.
  - **Hidden (new test):** the panel leaves off the public sector employee persona's account, so that person neither created the draft, sits on its panel nor is an administrator on any target. The test checks the draft appears in none of their lists and that its details aren't shown to them.
- **R-5.22 (four tests, both programs):** I kept the fixes already in place: errors are read by retrying, and the comment is written before being cleared. The three-decimal-places case is still not tested.
- **R-5.24 (two tests):** the submitted case now scores all three proponents on all four questions before submitting. It then confirms the submission took effect: no incomplete-evaluation error, and the list's status has changed. Only after that does it try to change a score. The change counts as refused if it can't be made or the page reports the evaluation read-only; afterwards the evaluation must still read as submitted.
- **R-5.25 (moved to v3, three tests):**
  - With complete drafts for two of three proponents, submission is not offered.
  - Trying to submit anyway submits nothing: the list status is unchanged and neither evaluation is read-only.
  - Once all three are complete, submission is offered and goes through. This shows the "not offered" result is a real difference and not just a control that never appears.

**Parts of criteria the files do not cover (explained in each file's header)**

- **R-5.25:** the service's own refusal of an incomplete set, with the quoted message. The form withholds submission whenever the set is incomplete, so no incomplete set ever reaches the service, and the incomplete-evaluation error has nothing to show.
- **R-5.9:** the service applying the rule by itself, separately from the form.
- **R-5.22:** a score with three decimal places being rejected, and the evaluation being unsubmittable afterwards. Submission is also withheld when nothing has been entered, so that reading says nothing about the bad entry.
- **R-5.24:** a draft becoming unchangeable once consensus starts. Consensus only starts after the evaluator has submitted everything, so they have no draft left to change.
- **R-5.1:** the panel members' actual names, and a message for the two-chair rule. The panel is compared only as the same text read twice.

**Surface additions that would close those gaps**

- An action on `evaluation-individual-list-swu` and its Team With Us sibling that submits the set without the form's check. The file-upload page already has actions like this for requests no form would send.
- An action on `evaluation-panel-swu` and its Team With Us sibling that saves a panel the form would refuse.
- A `multiple_chairs_error` observation on both panel pages.
- An observation of a score with too many decimal places on the individual create pages, such as `score_too_many_decimal_places_error`.
- An observation on the panel pages that lists the members by name.

**Risks for whoever runs these**

- **Default panel:** R-5.1, R-5.9 and R-5.19 assume a new draft names its creator as chair, which is what the R-5.1 and R-5.9 redo notes describe. If that's wrong, the step removing the creator will fail. For R-5.1 and R-5.9, that failure is read as a refusal, so the test could pass without testing anything.
- **Action inputs:** they follow the shapes the earlier tests used (`{ member }`, `{ order, score }`, `{ order, notes }`, `{ title }`), because the contract types them as `unknown`.