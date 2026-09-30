---
gate: G1
question: "1 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?"
recommendation: "Rule on R-8.29 with a calibration condition, so the next calibrate run can apply it."
opened: 2026-09-30T08:20:16.375Z
---

# 1 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-8.29 with a calibration condition, so the next calibrate run can apply it.

1 criterion(s) failed against the **old** target at http://localhost:4300, with no ruling yet.
The tests are blind: they were written from the criteria alone, by an agent that never saw the
application. So a failure means one of exactly three things, and only you can say which:
the application is wrong, the criterion is wrong, or the test is wrong.

Rule on each one below. Until every failure carries a ruling, this question is asked again on
every calibration run.

### R-8.29 · v1

- carried from 2026-09-30-17: none of its inputs has changed since that run measured it

An image placed into a piece of formatted text is stored as an ordinary file marked readable by anyone, and the text refers to it by an internal marker that is turned into a download address only when the text is displayed.

- given: an administrator editing a page's body with the image control
- when: they choose an image and it is accepted
- then: the image is inserted into the text as a reference the service resolves for itself, and a reader of the finished page sees the image
- test: tests/acceptance/files/R-8.29.spec.ts

**an image placed into a piece of formatted text is stored as an ordinary file marked readable by anyone, and the text refers to it by an internal marker that is turned into a download address only when the text is displayed** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
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

The question is whether R-8.29's failure against old (a truthiness check receiving an empty string) is the application's fault, the spec's, or the test's. Ruling: approve with defect-in-old. The old source shows the criterion is right and the old application fails it. The editor stores an embedded image in the body as ![name](FILE_ID:<uuid>) (prefix defined at shared/lib/resources/file.ts:80). The old Markdown view (lib/views/markdown.tsx:45-48) has a decodeImgSrc helper whose only job is to turn that marker into a download address when the text is displayed, which is exactly the behaviour the criterion describes. But the view renders through react-markdown ^10.1.0 (package.json:138) without overriding its default URL filter (markdown.tsx:141-145). That filter blanks any URL whose scheme is not on its safe list, and 'FILE_ID:' parses as such a scheme. So the custom img renderer receives an empty src, decodeImgSrc('') returns '', and the published page draws <img src="">: a reader of the finished page does not see the image. The reviewer at calibrate-triage-old-37 had already fixed the harness's reading of the published page and traced the empty value to this path, so the test is not at fault. The intent (the marker resolved at display time and the image visible to readers) is plainly what the old code meant to do, so the criterion stands as the rebuild's obligation rather than being rewritten to match the broken rendering. What would change this ruling: a rerun that pins the empty value to a different assertion (the inserted reference, the file id, or the signed-out download checks) rather than the published-page image check, which would make it a harness question again.

**Conditions:**
- defect-in-old R-8.29
