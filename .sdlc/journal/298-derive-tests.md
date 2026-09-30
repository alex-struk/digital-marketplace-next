---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-30T05:37:57.843Z"
cost: 0.5969336000000001
turns: 14
session: "60971885-0666-462b-b65b-d1903fbeda1a"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I rewrote the test for R-1.17 (v2) in the opportunities domain. It is the only criterion this run was given, so one criterion has a test and none went to `not-testable.yaml`. I have not run it or type-checked it: the environment refused the command without approval, so it is unverified until a later stage runs it. It uses the same surface calls, fixtures and seed handles as the version it replaces, which did compile.

**What the ruling found.** The old test added an out-of-limit question and then waited for a refusal while the question was still being entered, before anything was submitted. It timed out doing that for the over-length question text.

**What the new test does.** Every out-of-limit case now follows the same path as the guideline case that already passed:
1. Enter the question with `addTeamQuestion` (or `addResourceQuestion` for Team With Us).
2. Submit it by saving the draft with `saveDraft` and a title.
3. Only then wait for `fieldError` and check that it names the field at fault.

Each check matches one word in the refusal: "question", "guideline", "score", "word", or "minimum" for the minimum score. The over-length question text goes through exactly the same steps as the over-length guideline.

**The cases covered:**
- A question or guideline that is empty, or over 1,000 characters (both limits in the criterion).
- A maximum score of 0.
- A response word limit of 0, and of 3,001.
- A minimum score equal to the maximum, tested on both Sprint With Us and Team With Us. The criterion's note says the two programs share the same limits.
- A hundred and first question. It is added, the draft is saved, and the refusal is read. If the form will not take the 101st question at all, that counts as the refusal.
- Position set by place: two questions are added and saved, and the saved draft's team questions tab must list them in the order added.

No question is ever given a position, because the criterion says the person never enters one.

**Assumption.** Nothing in the contract says a saved draft checks its questions, or what words a refusal uses. The test assumes that saving is the submission the criterion means, and that each refusal contains its field's plain-language name. If the target only checks questions on submit-for-review or publish, the draft-save step would have to change.

**Gaps in the contract.** The Sprint With Us and Team With Us create pages offer only `fieldError()`, a single string. There is no per-field refusal on those pages like the `field_errors_by_field` observation the proposal create page has. Adding one would let the "names the offending field" part be checked by field rather than by a word in the message. Nothing else I needed was missing, and I changed no file outside `tests/acceptance`.