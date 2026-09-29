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

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Do the rewritten R-1.39 tests follow from the opportunities criterion and from nothing else? Yes. They also meet the open redo request. The by-program case now saves its own Code With Us draft and Sprint With Us draft, confirms both are listed before any program is chosen, and after each program is chosen checks separately that the matching one stays and the other goes, with messages that name the program and the failing half. It no longer depends on the shared seeded opportunity. Every case asserts only the criterion's 'then', that only opportunities matching every chosen condition remain visible, for program, state, remote-only, free text against title and against location, and the combined conditions. The before-anything-is-chosen checks are preconditions the test sets up for itself, not added claims. Nothing about the implementation leaks in: only contract surface actions and observations are used, and the runner's typecheck passed on this revision. Using two programs rather than three matches what the redo asked for and is enough to show the list narrowing; the three programs in the criterion's 'given' describe the setting and are not a clause needing its own assertion. not-testable.yaml is unchanged and no clause is left unasserted. This ruling would change if a test were shown to assert anything beyond narrowing to matching opportunities, or if calibration showed that treating an unreadable empty group as empty hides a real failure, which would go to the contract stage rather than back to this writer.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `8220340620204068b36881f59e30ccec3e22ae1a`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    No diagnostics.
