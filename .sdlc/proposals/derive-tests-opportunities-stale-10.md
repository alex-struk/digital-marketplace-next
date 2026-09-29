---
gate: G3
question: "Do these tests follow from the opportunities criteria and from nothing else?"
recommendation: "I rewrote the one criterion in scope, R-1.39 (v1), in `tests/acceptance/opportunities/R-1.39.spec.ts`."
opened: 2026-09-29T23:44:07.127Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** I rewrote the one criterion in scope, R-1.39 (v1), in `tests/acceptance/opportunities/R-1.39.spec.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote the one criterion in scope, R-1.39 (v1), in `tests/acceptance/opportunities/R-1.39.spec.ts`. It has a test file again, nothing was recorded as not testable, and `not-testable.yaml` is unchanged. I could not type-check or run the file: the compiler call needs approval this session doesn't have, and there is no application here to run against.

**What the ruling asked for.** The old by-program case leaned on a closed Sprint With Us opportunity from the seed, which other tests share. It also could not tell a failure before any program was chosen from one after Sprint With Us was chosen. The new case signs in as the administrator and saves two drafts of its own: one through `opportunityCwuCreate.saveDraft` and one through `opportunitySwuCreate.saveDraft`, each with a title unique to this test. It opens the list and confirms both are there before any program is chosen. It then chooses Code With Us and checks two things separately: that the Code With Us draft is still listed, and that the Sprint With Us draft is gone. It reopens the list, confirms both drafts again, and repeats the two checks after choosing Sprint With Us. Every check's failure message names the moment it was made and which half failed, for example: `After program "Sprint With Us" is chosen, the Code With Us opportunity: "…" should no longer be listed, and still is`. The test no longer imports `seed`, since nothing in it depends on shared seeded data.

**The other four tests.** I kept the cases for state, remote-only, free text and the combined condition, and gave them the same treatment. Each creates its own opportunities and confirms they are listed before anything is chosen. Where a test applies a second condition, it re-confirms the list after reopening it. Each check's message names the condition chosen and whether the matching or the non-matching opportunity failed. Nothing asserts beyond the criterion's given/when/then. The combined case tests only its "then": that only opportunities matching every chosen condition stay visible.

**Missing from the surface.** No actions or observations were missing for this criterion. One gap is worth the contract's attention: the list has no per-row observation. The tests can only read the whole text of `unpublishedGroup`, `openGroup` and `closedGroup` and look for a title in it. An empty group may not be readable at all, so the tests treat an unreadable group as empty. A per-row or per-title observation on `opportunityList` would make these checks more precise.

I made no changes outside `tests/acceptance`.
