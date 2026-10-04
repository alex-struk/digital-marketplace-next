| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-10-04T22:45:22.351Z |
| holder | agent:product-owner |

# 1 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-2.36 with a calibration condition, so the next calibrate run can apply it.

1 criterion(s) failed against the **old** target at http://localhost:3100, with no ruling yet.
The tests are blind: they were written from the criteria alone, by an agent that never saw the
application. So a failure means one of exactly three things, and only you can say which:
the application is wrong, the criterion is wrong, or the test is wrong.

Rule on each one below. Until every failure carries a ruling, this question is asked again on
every calibration run.

### R-2.36 · v1

Submitting a proposal, awarding one and withdrawing one each send notifications: a confirmation to the submitting vendor, an award notice to the winner and a decision notice to everyone else, and a withdrawal notice to the vendor and to every administrator.

- given: an opportunity with three submitted proposals
- when: one of them is awarded
- then: its vendor receives an award notice and the other two vendors each receive a decision notice, and a later withdrawal sends a notice to the withdrawing vendor and to every administrator
- test: tests/acceptance/proposals/R-2.36.spec.ts

**Submitting a proposal, awarding one and withdrawing one each send notifications: a confirmation to the submitting vendor, an award notice to the winner and a decision notice to everyone else, and a withdrawal notice to the vendor and to every administrator. (withdrawing)** — failed

```
Error: administrators missing from the blind-copy list of the withdrawal notice

administrators missing from the blind-copy list of the withdrawal notice

[2mexpect([22m[31mreceived[39m[2m).[22mtoEqual[2m([22m[32mexpected[39m[2m) // deep equality[22m

[32m- Expected  - 1[39m
[31m+ Received  + 4[39m

[32m- Array [][39m
[31m+ Array [[39m
[31m+   "admin.one@example.test",[39m
[31m+   "admin.two@example.test",[39m
[31m+ ][39m

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
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
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

The question is whether R-2.36's withdrawal failure is the old application's fault, the criterion's, or the test's. Ruling: approve, with test-wrong on R-2.36. The criterion says only that a withdrawal sends a notice to the vendor and to every administrator; it says nothing about how that notice is addressed. The test (tests/acceptance/proposals/R-2.36.spec.ts, the withdrawing case) counts an administrator as reached only if they appear as a blind copy on a message addressed to the service's own address. It reasons from R-6.15, which covers notices that go to several people at once, and assumes the administrators' notice is one of those. Nothing in R-2.36 says that. The old source the criterion cites (handleCWUProposalWithdrawn in code-with-us.tsx, lines 100-152, and withdrawnCWUProposalSubmissionT at line 346) does notify every administrator, so the criterion is an accurate record and neither defect-in-old nor spec-wrong fits. The submitting and awarding cases passed and are left alone. The criterion's confidence and wording stay as they are. What would change this ruling: if the redone test still finds no withdrawal notice reaching an administrator by any route, visibly or as a blind copy, the next calibration should rule defect-in-old instead.

**Conditions:**
- test-wrong R-2.36: the criterion requires that every administrator is notified of a withdrawal and says nothing about how the notice is addressed; the test only counted administrators found as blind copies on messages addressed to the service's own address, so a notice reaching an administrator any other way was missed. It should accept any withdrawal notice that reaches each administrator, as a visible or a blind-copied recipient, as the awarding case already does.
