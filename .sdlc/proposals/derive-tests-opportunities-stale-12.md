---
gate: G3
question: "Do these tests follow from the opportunities criteria and from nothing else?"
recommendation: "I rewrote R-1.17's test for v3 of the criterion, so the one criterion I was given has a test."
opened: 2026-09-30T06:55:54.523Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** I rewrote R-1.17's test for v3 of the criterion, so the one criterion I was given has a test.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote R-1.17's test for v3 of the criterion, so the one criterion I was given has a test. I also recorded one clause the test can't reach. None of it has been run or type-checked: the workspace has no installed dependencies, and running the YAML check needed approval that wasn't granted. I matched the new entry's indentation to the entries around it by eye.

**Why the test had to change.** The file was still at v2, written for a spec where saving a draft counted as submission and every limit was checked there. v3 says the opposite: the limits apply only when an opportunity is submitted for review or published, and a draft may be saved holding a question that breaks them. Every refusal test in the old file saved a draft and expected an error, which v3 says will not happen. I replaced the whole file, keeping the old approach of adding questions without a position and reading back their order.

**What `tests/acceptance/opportunities/R-1.17.spec.ts` now does.** It has fifteen tests, each titled with the criterion's statement plus a short note naming the case. Each opportunity is complete except for one broken question field, so any refusal can only come from that field:
- **Submitted for review (Sprint With Us, as public sector staff):** an empty question, a question over 1,000 characters, an empty guideline, a guideline over 1,000 characters, a score of 0, a word limit of 0 and a word limit of 3,001. Each expects `fieldError` to name the field.
- **Minimum score on both programs:** a Sprint With Us minimum equal to the maximum, and a Team With Us minimum above it, both submitted for review. The spec's note says the two programs' question rules differ only in name.
- **Published (as an administrator):** one case per program, a Sprint With Us word limit over 3,000 and a Team With Us empty guideline.
- **Position beyond 100:** positions are set by place, so only a 102nd question can be out of range. The test submits 102 questions for review and expects a refusal. If the form won't accept the 102nd question at all, the test counts that as refused and passes early, the same way the old test handled its 101st. I dropped the old "at most 100 questions" test because v3 no longer states that cap.
- **Order follows place:** two questions are saved on a draft, and the edit page's team-questions tab must list them in the order they were added.
- **Drafts are not checked:** one draft per program is saved with a question that breaks several limits at once. The draft's identifier must be readable, and the question must appear on the edit page's team-questions or resource-questions tab.

**The clause I couldn't test.** I added an entry to `tests/acceptance/not-testable.yaml` for R-1.17 v3, clause "its position is never entered by the person", marked `blocked:` with owner `contract`. The test shows the position follows a question's place, but nothing on the surface says whether the question form offers a position or order field. A form that still let a person type one in would pass. No criterion was declined outright.

**What the contract should add:** an observation on `opportunity-swu-create` and `opportunity-twu-create` that reports which fields an evaluation question offers for entry, or at least whether any position or order field is offered. Everything else this criterion needed was already on the surface.

Beyond those two files I edited nothing.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the R-1.17 v3 tests follow from the criterion and nothing else, and is every clause asserted or recorded as not testable? Ruling: return. The rewrite correctly moves every refusal from draft save to submission for review and publication, covers both programs for the minimum score and for publication, and adds draft tests showing out-of-limit questions can be saved; the runner's typecheck passed, and the not-testable entry for 'its position is never entered by the person' names a real missing observation. But the criterion's clause that the minimum score is optional is asserted by no test and recorded in no not-testable entry: every submission and publication test expects a refusal, so an application that required a minimum score would pass all fifteen. The surface reaches this clause: the edit screen offers the opportunity's status, so an accepted submission can be observed. Following the reviewer brief, a clause the writer could assert and did not is grounds to return, not a note on an approval. The same gap exists at the in-range edges (1,000 characters, a 3,000-word limit, position 100), which are only tested one step past the limit. This would be approved once the optional-minimum clause is asserted by an accepted submission, or recorded as not testable with a real reason.

**Conditions:**
- In tests/acceptance/opportunities/R-1.17.spec.ts, assert the clause 'an optional minimum score': submit for review a Sprint With Us opportunity, complete as in the other tests, whose question is well formed and has no minimum score, and assert the submission is accepted (for example, no field error, and the opportunity's status on its edit screen shows it has left draft). If the surface cannot observe an accepted submission, add a not-testable.yaml entry for R-1.17 v3 with clause 'an optional minimum score' naming exactly what is missing.
- In the position test in tests/acceptance/opportunities/R-1.17.spec.ts, the criterion allows positions 0 to 100: either assert that an opportunity holding 101 questions (the last at position 100) is not refused on submission for review, or record that clause in not-testable.yaml with the reason.

### Runner-owned typecheck evidence

Proposal revision: `3de943f867275f9bce9216c72d3213edd1f7a32a`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    No diagnostics.
