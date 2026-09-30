---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-30T07:10:51.592Z"
cost: 0.5444372000000001
turns: 17
session: "e8453a37-7cb7-42d2-a073-372ada89fcc8"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

R-1.17 (v3) now has its complete test. It was the only criterion I was given, and it no longer has an entry in `tests/acceptance/not-testable.yaml`. I couldn't compile or run anything here: the type check needed approval that this session can't get. The new calls use only methods declared in `tests/generated/surface.d.ts`, but nothing has confirmed that the file compiles or that the tests pass.

**What was owed.** An earlier run had already written `tests/acceptance/opportunities/R-1.17.spec.ts`. It covered every clause except "its position is never entered by the person", which sat in `not-testable.yaml` because nothing could show whether the question editor offers a position or order field. The contract stage has since added the observation `evaluation_question_fields` to four pages: the Sprint With Us and Team With Us create pages and their edit pages. According to the contract, it lists the fields one question offers: question, guideline, response_word_limit, maximum_score and minimum_score, with no position or order field.

**What I added.** Two tests in the existing file, one for each program. Each one signs in as the public sector staff persona and adds one question on the create page. It reads `evaluationQuestionFields()`, then saves a draft, opens that draft on the edit page and reads the fields again. On both pages it checks that all five fields are named and that nothing matches "position" or "order". The name checks accept either underscores or spaces, because the contract doesn't say how the observation's text is formatted. I also dated the header 2026-09-30 and added a paragraph to the file's opening comment explaining how this clause is checked. I deleted the R-1.17 entry, since every clause of the criterion is now asserted and it can't have both a test and an entry.

**One thing the contract should fix.** The comment in `surface.yaml` says the observation reports on "the question at a given place in the list (the first is 1)", but the generated `evaluationQuestionFields()` takes no argument, so a test can't say which place it means. I kept each test to a single question so the answer can't be ambiguous. The contract should either give the observation that parameter or remove the wording.

No other surface action or observation was missing. I edited only `tests/acceptance/opportunities/R-1.17.spec.ts` and `tests/acceptance/not-testable.yaml`.