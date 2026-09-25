---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-25T11:19:39.978Z"
cost: 2.9746482
turns: 51
session: "d257ca25-11ed-4b71-9a74-4bf71e89ec46"
---

I wrote tests for all nine criteria except R-5.9, which is now recorded as blocked instead. None of these files has been run or type-checked: running the compiler and the YAML parser both needed approval, so I checked the types against the tsconfig and generated files by eye.

**The three redone tests (R-5.1, R-5.17, R-5.18).** R-5.18 was not on the redo list, but it moved to v2 and its old file was still at v1, so I rewrote it too.
- **R-5.1** no longer assumes what a new draft's panel holds. The administrator first reads each person's name off their profile, so the panel screen can be read person by person. Then each case builds exactly the faulty panel it names and reads it back before saving:
  - For the panel of one, every other member is removed and the creator is made chair, and the test confirms the panel names only the creator, once.
  - For two chairs, the test starts from a two-person panel with one chair and marks the other member. It then requires only that the panel never shows more than one chair, so a chair that moves counts as the refusal.
  - When the same person is named twice, the duplicate-member message is still always required.
  - For the other faults, a panel the screen won't let you build counts as refused; otherwise the named rule is waited for, and the panel must read as it did before.
- **R-5.17** now opens every caught message, found both through the full message list and through searches, and reads its visible and blind-copy recipients. It applies this to the person added and to the two already on the panel. Before adding anyone, it checks by name that the panel holds exactly those two people and that the opportunity is not a draft. The draft case waits five seconds and then finds none of the three reached.
- **R-5.18** tests both halves of v2:
  - What the service returns is read through `evaluation-panel-request.panel_as_stored`. It is shown to the administrator, the owner and a panel member, and not to a vendor or the unconnected staff member.
  - The panel screen opens for the administrator and the owner, and shows no rows to the panel member, the unconnected staff member or the vendor.

  Each role uses the seeded opportunity that fixes it: the owner off the panel, the chair who doesn't evaluate, and another staff member's opportunity. Using `panel_as_stored` as "what the service returns to the reader" is my reading of the contract, and I'd call it the weakest assumption in this set.

**The five handed back (R-5.11, R-5.21, R-5.23, R-5.26, R-5.37).** All five now have tests, and their not-testable entries are removed.
- **R-5.11:** on the seeded opportunity of another staff member, the unconnected public sector account is refused another member's evaluation, and the administrator can read it.
- **R-5.21:** the chair who doesn't evaluate and the owner who isn't on the panel are both refused when they try to score, and the evaluator on the panel scores and can open the result.
- **R-5.23:** a draft with a score of 6 on a question worth 5 and one empty comment is saved through the request page. The test reads back that the 6 was stored and that nothing was refused, then submits the whole set and requires a refusal with the draft left unchanged. The other two proponents are scored properly first, so the bad draft is the only problem in the set.
- **R-5.26:** one complete draft is submitted on its own, must be refused as unrecognised, and must still read as a draft afterwards.
- **R-5.37:** a staff member with no role is put on a draft's panel through the request page. The error must name that person by name, email or account id, and the stored panel must be unchanged.

**R-5.9 is blocked, and I deleted its test file.** The criterion is about the service refusing a panel with no chair. Every action that saves a panel goes through the browser form, which the criterion says already refuses one, so a refusal seen there proves nothing about the service. And, as the ruling found, removing the chair on the panel screen leaves that person still named as chair. The panel request page only offers the no-role submission. The entry is owned by `contract`.

**Surface additions the contract should make:**
- `evaluation-panel-request.submit_panel_with_no_chair` and `evaluation-panel-request.missing_chair_error`: these unblock R-5.9.
- A not-found observation on `evaluation-panel-swu`/`-twu`: R-5.18's "Not Found" wording can't be read today, so that test only checks the panel isn't shown.
- A plain read of the panel on `evaluation-panel-request`, as the signed-in person: this would replace my borrowing of `panel_as_stored` in R-5.18.
- A seeded opportunity past individual evaluation where an evaluator has no evaluation of some proponent yet: the "only while in individual question evaluation" part of R-5.21 isn't tested. Every seeded opportunity at consensus already has all its evaluations submitted, so a late attempt would hit the duplicate refusal instead.

**Two readings that could fail for the wrong reason.**
- In R-5.23, the whole-set submission counts as refused if the list withholds it, reports it incomplete, or the service reports a refusal at submission.
- In R-5.37, "identifying the offending member" is taken to mean naming them by name, email or id. If the service identifies the member by position instead, that test fails.

I changed nothing outside `tests/acceptance`. The R-5.34 entry in `not-testable.yaml` isn't in this run's list, so I left it as it was.