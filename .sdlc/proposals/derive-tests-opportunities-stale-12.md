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
