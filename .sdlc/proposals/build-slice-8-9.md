---
gate: G3
question: "Does slice 8 (Anyone can find opportunities and follow the ones they care about) do what its criteria say?"
recommendation: "I made one targeted fix for the R-1.11 regression and checked that the six earlier conditions are still met in the code."
opened: 2026-10-02T06:55:45.288Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 8 (Anyone can find opportunities and follow the ones they care about) do what its criteria say?

**Recommendation.** I made one targeted fix for the R-1.11 regression and checked that the six earlier conditions are still met in the code.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made one targeted fix for the R-1.11 regression and checked that the six earlier conditions are still met in the code. I could not run the application. Starting its containers needed an approval nobody was here to give. So the R-1.11 fix comes from reading the code against the criterion, not from reproducing the failure. It is my best explanation, not a confirmed one. `npm --prefix app run check` passes: typecheck plus all unit tests in migrations (16), backend (427) and frontend (278).

**R-1.11.** The criterion says an opportunity that is not a draft must *state* whether remote work is acceptable, and must describe remote work when it is. Code With Us refused both cases. The previous revision (decision record 0040) made Sprint With Us and Team With Us refuse remote work that was accepted but not described. It still kept a creation that said nothing about remote work, treating it as "not acceptable". So an administrator could publish one in either program without answering the question, and it was listed under Open. That is exactly where the test found what it expected to have been refused. This was the only way left, in any program, for a non-draft opportunity to break R-1.11. It only showed now because before slice 8 neither program could be created and the list did not exist.

- **The service:** `remoteWorkProblems` in `app/backend/src/rules/other-program-drafts.ts` now refuses a non-draft creation whose `remoteOk` is not a clear yes or no. The answer is a 400 reading `remoteOk: Say whether remote work is acceptable.`, the same words Code With Us uses, listed alongside any problem with the description. Nothing is kept, and drafts are still never refused.
- **The create screens** now show that refusal on the remote-work question as well as in the `field-error` list, and their opening sentence says this rule is checked.
- **The forms still start on "No"**, as decision record 0031 settled for slice 7 and as the Sprint With Us and Team With Us invalid stories draw it. I tried starting them unanswered and reverted it, because that risked breaking slice-7 publishing that already passes.
- **Decision record 0041** records the change; I added a pointer to it in 0040, whose choice it reverses.
- **The trade-off:** 0040 had kept the unanswered case so that requests creating test data for the staff and administrator lists would not be refused. Against the original service, a published opportunity in either program needed a complete body, including the remote answer, so I judged that risk small. If R-1.3 or R-1.38 now fails with an empty Unpublished or Open group, this choice is the first thing to look at.

**Unit tests added or changed:** rule tests for an unanswered question (alone, and together with an over-long description) and for drafts staying exempt. An end-to-end test that a published Team With Us creation with no answer is refused and nothing is kept. Two existing end-to-end creations now state their remote answer. A frontend test that the refusal appears both in the summary and on the question.

**The six open conditions from build-slice-8-3**, each checked in the code; none is reproduced in a running application:
- **#1 R-1.3 and #3 R-1.38 (list read as empty):** handled by records 0038 and 0039. A failed session check no longer signs anyone out, the list is requested alongside the session, and a screen is drawn once it knows who it is for. The latest ruling's R-1.11 failure quotes the Open group's text, so the list now does render there.
- **#2 R-1.5:** a second watch is refused as `{ "conflict": [...] }` (record 0037, `watching.service.ts`).
- **#4 R-7.18:** handled by records 0038 and 0039; a content page that fails to load or faults is retried rather than drawn as not found.
- **#5 R-1.23:** the published date is the day it fell on in Pacific time (`readDate` in `app/frontend/src/lib/dates.ts`, record 0037).
- **#6 layout:** `PageContainer` and `Stack` are defined once, in `app/frontend/src/app/page-layout.tsx`, matching `design/catalogue/layout.tsx`, and the root layout wraps every screen in the container. No screen sets its own page width; the one `maxWidth` left is on a profile image.

**Slice 8's criteria** (R-1.2, R-1.3, R-1.5, R-1.6, R-1.38, R-4.22, R-6.20, R-6.21, R-6.27) are as earlier revisions built them under records 0034 and 0037 to 0040; this revision did not touch them. Nothing in the specification was left unbuilt here, and nothing outside `app/` and `docs/decisions/` needed changing.

**For the next slices:** the Sprint With Us and Team With Us public and manage pages, and their full content rules, are still slice 10's. Until then, the remote-work rule is the only content check in those two programs.
