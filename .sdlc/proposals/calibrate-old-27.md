---
gate: G1
question: "1 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?"
recommendation: "Rule on R-1.33 with a calibration condition, so the next calibrate run can apply it."
opened: 2026-10-03T02:14:31.087Z
---

# 1 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-1.33 with a calibration condition, so the next calibrate run can apply it.

1 criterion(s) failed against the **old** target at http://localhost:4300, with no ruling yet.
The tests are blind: they were written from the criteria alone, by an agent that never saw the
application. So a failure means one of exactly three things, and only you can say which:
the application is wrong, the criterion is wrong, or the test is wrong.

Rule on each one below. Until every failure carries a ruling, this question is asked again on
every calibration run.

### R-1.33 · v2

The service accepts a private note, with files, on a Code With Us or Sprint With Us opportunity's history from an administrator or the opportunity's author at any point in the opportunity's life, visible only to the author and administrators, but no screen of the application offers a way to add one.

- given: a Code With Us or Sprint With Us opportunity in any state
- when: its author adds a note of up to 1,000 characters with attachments
- then: the note and its attachments appear in the opportunity's history, which only the author and administrators can see
- test: tests/acceptance/opportunities/R-1.33.spec.ts

**The service accepts a private note, with files, on a Code With Us or Sprint With Us opportunity's history from an administrator or the opportunity's author at any point in the opportunity's life, visible only to the author and administrators, but no screen of the application offers a way to add one. — when its author adds a note with a file to a published Sprint With Us opportunity, the note and its file appear in the opportunity's history** — failed

```
Error: the file to attach should have been stored

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**The service accepts a private note, with files, on a Code With Us or Sprint With Us opportunity's history from an administrator or the opportunity's author at any point in the opportunity's life, visible only to the author and administrators, but no screen of the application offers a way to add one. — when its author adds a note with a file to a published Code With Us opportunity, the note and its file appear in the opportunity's history** — failed

```
Error: the file to attach should have been stored

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**The service accepts a private note, with files, on a Code With Us or Sprint With Us opportunity's history from an administrator or the opportunity's author at any point in the opportunity's life, visible only to the author and administrators, but no screen of the application offers a way to add one. — when an administrator adds a note with a file to a cancelled Code With Us opportunity, the note and its file appear in the opportunity's history** — failed

```
Error: the file to attach should have been stored

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**The service accepts a private note, with files, on a Code With Us or Sprint With Us opportunity's history from an administrator or the opportunity's author at any point in the opportunity's life, visible only to the author and administrators, but no screen of the application offers a way to add one. — a public sector staff member who is not the opportunity's author is not shown a private note or its file** — failed

```
Error: unbound: signIn.public-sector-staff-other — The oracle carries exactly three sign-in routes outside production — /auth/createsessionadmin, /auth/createsessiongov and /auth/createsessionvendor/:n — and the two public sector ones each mint a session for one fixed account. No route, and no parameter on the government route, reaches a second non-administrator public sector account, so this persona can be seeded and observed on the oracle but never acted as.
```

**The service accepts a private note, with files, on a Code With Us or Sprint With Us opportunity's history from an administrator or the opportunity's author at any point in the opportunity's life, visible only to the author and administrators, but no screen of the application offers a way to add one. — a reader who is not signed in is not shown a private note or its file** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"Seeded private note: placeholder text for the history visibility check."[39m
Received string:        [31m"NOTE_ADDED | [7mSeeded private note: placeholder text for the history visibility check.[27m | Casey Placeholder | 2026-01-06T18:00:00.000Z | opportunity-note-attachment.txt (00000000-0000-4000-8000-000000000903)[39m
[31mPUBLISHED |  | Robin Placeholder | 2026-01-05T18:00:00.000Z | [39m
[31mDRAFT |  | Casey Placeholder | 2026-01-05T17:00:00.000Z |"[39m
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

The question is whether each of R-1.33's five failures against the old application is the application's fault, the spec's or the test's. Ruling: approve with test-wrong. Three failures (the author adding a note to a published Sprint With Us opportunity, the author adding one to a published Code With Us opportunity, and an administrator adding one to a cancelled Code With Us opportunity) stop at the test's own setup, before any note is added. The test uploads its attachment without saying who may read the file, and the old service rejects any upload that leaves that out (sources/old/src/back-end/lib/resources/file.ts:138-140, 'Invalid metadata provided.'). There is then no file id to attach, so the criterion is never tested. The failure for a public sector staff member who is not the author is a harness limit: the test harness cannot sign in to the old application as a second non-admin public sector account. The withholding check itself is correct and should stay. The failure for a reader who is not signed in is a real defect in the old application: processForRole (code-with-us.ts:248-256) removes createdBy from the opportunity for anyone not signed in, so the history check at lines 478-481 compares undefined === undefined, which is true, and the full private history, notes and attachment names included, is returned to anonymous readers. The criterion is right there and the test correctly fails. The condition grammar allows one verb per criterion, and three of the five failures never reached the behaviour being tested, so the test is sent back to be written again. What would change the ruling: if the rewritten test's signed-out case still fails the same way, the next ruling is defect-in-old R-1.33, which makes keeping private history away from anonymous readers a requirement the rebuild has to pass. If the files criteria turn out not to require stating who may read an upload, the upload refusal is a gap in the files spec and should be settled there.

**Conditions:**
- test-wrong R-1.33: the attachment is uploaded without saying who may read the file, which the service requires of every upload, so the upload is refused, no file is stored and the note is never added; the test should upload its attachment the way the files criteria say an upload succeeds, then add the note. Keep the check that a reader who is not signed in is not shown the note or its file exactly as written.
