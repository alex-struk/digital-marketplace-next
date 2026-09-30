| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-30T07:10:51.627Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** R-1.17 (v3) now has its complete test.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

R-1.17 (v3) now has its complete test. It was the only criterion I was given, and it no longer has an entry in `tests/acceptance/not-testable.yaml`. I couldn't compile or run anything here: the type check needed approval that this session can't get. The new calls use only methods declared in `tests/generated/surface.d.ts`, but nothing has confirmed that the file compiles or that the tests pass.

**What was owed.** An earlier run had already written `tests/acceptance/opportunities/R-1.17.spec.ts`. It covered every clause except "its position is never entered by the person", which sat in `not-testable.yaml` because nothing could show whether the question editor offers a position or order field. The contract stage has since added the observation `evaluation_question_fields` to four pages: the Sprint With Us and Team With Us create pages and their edit pages. According to the contract, it lists the fields one question offers: question, guideline, response_word_limit, maximum_score and minimum_score, with no position or order field.

**What I added.** Two tests in the existing file, one for each program. Each one signs in as the public sector staff persona and adds one question on the create page. It reads `evaluationQuestionFields()`, then saves a draft, opens that draft on the edit page and reads the fields again. On both pages it checks that all five fields are named and that nothing matches "position" or "order". The name checks accept either underscores or spaces, because the contract doesn't say how the observation's text is formatted. I also dated the header 2026-09-30 and added a paragraph to the file's opening comment explaining how this clause is checked. I deleted the R-1.17 entry, since every clause of the criterion is now asserted and it can't have both a test and an entry.

**One thing the contract should fix.** The comment in `surface.yaml` says the observation reports on "the question at a given place in the list (the first is 1)", but the generated `evaluationQuestionFields()` takes no argument, so a test can't say which place it means. I kept each test to a single question so the answer can't be ambiguous. The contract should either give the observation that parameter or remove the wording.

No other surface action or observation was missing. I edited only `tests/acceptance/opportunities/R-1.17.spec.ts` and `tests/acceptance/not-testable.yaml`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the new R-1.17 tests follow from the opportunities criterion and from nothing else? Ruling: approve. The criterion says each Sprint With Us and Team With Us evaluation question carries a question, guideline, maximum score, response word limit and optional minimum score, and that its position is set by its place in the list and never entered by the person. The two added tests, one per program, add one question on the create screen and read the fields it offers through the contract observation evaluationQuestionFields, then read them again on the edit screen after saving a draft. On both screens they check that the five fields the criterion names are offered and that no position or order field is. Every assertion follows from the criterion's text, nothing but generated surface calls is used, and the runner's typecheck passed with no diagnostics. With the last clause now asserted, deleting the R-1.17 entry from not-testable.yaml is correct. The change to tests/results/old/applied.yaml is the pipeline's own housekeeping, not the writer's output. The contract's description of the observation mentions a place in the list that the generated method takes no argument for; the tests avoid it by using a single question, so it does not bear on them. The owed missing test for R-1.17 stays open until a run of these tests is recorded. The ruling would change if a run showed the observation's reported labels could not be matched to the criterion's field names, which calibration would sort as an adapter or product question.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `60c4e683599bb3ed03200a5ecf2a239ffb023b6c`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    No diagnostics.
