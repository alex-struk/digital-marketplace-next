---
gate: G3
question: "Does slice 19 (Sprint With Us and Team With Us proposals go through their challenge stages to an award) do what its criteria say?"
recommendation: "I made no change to slice 19's application behaviour in this revision."
opened: 2026-10-04T18:28:56.528Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does slice 19 (Sprint With Us and Team With Us proposals go through their challenge stages to an award) do what its criteria say?

**Recommendation.** I made no change to slice 19's application behaviour in this revision.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I made no change to slice 19's application behaviour in this revision. The one failure in the ruling can't be fixed from this slice without building another slice's work.

**What failed:** the ruling passed six of the seven criteria (R-1.25, R-1.42, R-1.49, R-2.28, R-2.31, R-2.35). R-2.30 failed. The saved page outline shows the test opening `/opportunities/sprint-with-us/…/proposals/…/export` and getting "Page not found". That printable copy of a proposal belongs to Slice 20 in `plan/tasks.md`, together with the all-proposals export and the completed-opportunity report.

R-2.30 itself only asks that the price score be the bid's share of the lowest bid still in contention, worked out when the last human-entered score is recorded. The score must also go into the proposal's history, and the proposal must become fully evaluated. The ruling found the application already does this: price scores and the move to processing are written in one locked transaction, with unit and end-to-end tests. The failure comes from the test opening the export page outside its guards. Fixing that belongs to the test-writing stage, and the ruling has already sent it there.

**Why I didn't build the export page:** it would mean building Slice 20's work here, which this stage must not do. It would also be guesswork, since Slice 20's criteria (R-1.40, R-2.37, R-2.38) set who may read that page and what it hides from staff before the challenge stage. A partial page here would pre-empt that slice. R-2.30 should pass once its test is rewritten without the export page, or once Slice 20 delivers the page.

**One change I did make:** this workspace had no packages installed, so I installed them and ran `npm --prefix app run check`. On that first run after the install, one backend end-to-end test failed. Every later run passed in full. The failing file runs PostgreSQL inside the test process: it takes about 6s on a warm run but took 15s on that first run, and one of its tests went over the 5-second-per-test default. Because `check` decides whether this proposal fails, I raised the backend limits in `app/backend/vitest.config.mts` to 30s per test and 60s per setup step, with a comment saying why. Afterwards the whole check passed: 16 tests in the shared package, 836 in the backend and 508 in the frontend.

I added no decision record; the comment in the config file explains the change. **What's still missing:** Slice 20 will find that no export, printable copy or opportunity report exists yet for any of the three programs.
