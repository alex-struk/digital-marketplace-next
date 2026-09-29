---
gate: G1
question: "1 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?"
recommendation: "Rule on R-8.12 with a calibration condition, so the next calibrate run can apply it."
opened: 2026-09-29T14:09:20.918Z
---

# 1 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-8.12 with a calibration condition, so the next calibrate run can apply it.

1 criterion(s) failed against the **old** target at http://localhost:4300, with no ruling yet.
The tests are blind: they were written from the criteria alone, by an agent that never saw the
application. So a failure means one of exactly three things, and only you can say which:
the application is wrong, the criterion is wrong, or the test is wrong.

Rule on each one below. Until every failure carries a ruling, this question is asked again on
every calibration run.

### R-8.12 · v1

A request for a file the requester may not read is answered as not authorized, and so is a request for a file that does not exist — unless the requester is an administrator, who is told it was not found.

- given: an identifier that no stored file carries
- when: a vendor asks for it, and then an administrator asks for it
- then: the vendor is told they are not authorized and the administrator is told it was not found
- test: tests/acceptance/files/R-8.12.spec.ts

**a request for a file the requester may not read is answered as not authorized** — failed

```
Error: the upload of "not-shared.txt" was not stored: refused for its read-access statement: 503 {"database":["Database error."]}; refused for the length of its name: 503 {"database":["Database error."]}; refused for its size: 503 {"database":["Database error."]}; answered with a fault of the service: 503 {"database":["Database error."]}
```

## Calibration conditions

One condition per line, and exactly one of these forms:

- `defect-in-old <ID>` — the old application really does fail this and the criterion is right
  anyway. The test stands as written and the rebuild has to pass it; the criterion keeps a note
  saying so. No text after the ID.
- `spec-wrong <ID>: <corrected statement>` — the criterion misdescribes what the old application
  does. The statement is replaced and its version bumped, which marks the test stale so
  `derive-tests --stale` writes it again from the corrected criterion.
- `test-wrong <ID>: <why>` — the criterion is right and the test is not. The id goes to
  `tests/acceptance/redo.yaml` for `derive-tests` to redo, still blind, and `<why>` records what
  the test got wrong without describing how the application is built.

The ID is the criterion's own id exactly as `spec/criteria-index.json` spells it. `defect-in-old`
takes no text; the other two require a colon and text on the same line. A condition may not span
more than one line.


## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether R-8.12's failure against old is the application's fault, the spec's, or the test's. Ruling: approve, with R-8.12 marked test-wrong. The failure happened during the test's own setup, before the behaviour the criterion describes was exercised: the upload of the file the vendor may not read was answered 503 Database error, so the vendor's request was never made and the not-authorized answer was never observed. The failure says nothing about the criterion, so defect-in-old would wrongly turn a refused upload into a rebuild obligation, and spec-wrong has nothing to correct. The same upload, by the same persona with the same empty read-access list, is stored in R-8.6 and R-8.10 in this run. R-8.12 differs from them in first signing in as an administrator and re-establishing both accounts as active, which the criterion does not ask for. R-8.5, which has the same opening step, had its upload refused in an earlier run. The confidence of R-8.12 is untouched. What would change this ruling: if the same upload is refused with no preliminary account handling, the 503 is a real fault of the old application, and it belongs in a new criterion about uploads rather than in R-8.12.

**Conditions:**
- test-wrong R-8.12: the test failed in its own setup and never made the request the criterion is about: the file it needed was never stored, because it runs preliminary account-status steps as an administrator that the criterion does not require, and the service refused the upload that followed, while the same upload by the same persona without those steps is stored elsewhere in the suite. Reach a stored file the vendor may not read without depending on those steps, and report a setup that could not store the file as a setup failure rather than as the criterion failing.
