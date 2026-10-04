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

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Does slice 19 do what its criteria say? Approve. The verify result is pass and current for this proposal: it was recorded against application tree 4f0236b, which is this branch's app tree, and all seven claimed criteria (R-1.25, R-1.42, R-1.49, R-2.28, R-2.30, R-2.31, R-2.35) were exercised and met. The proposal page's account of an R-2.30 failure on the missing export page describes an earlier run and no longer stands; the export, printable copy and completed-opportunity report remain Slice 20's (R-1.40, R-2.37, R-2.38) and nothing here pre-empts them. The code matches the criteria. Stage scores are refused at the wrong stage with the criterion's exact message, and the proposal page offers only what the service accepts (R-2.28). Starting the team scenario is refused until every code-challenge proponent is scored or disqualified and at least one is screened in (R-1.42). The last final-stage score works out price scores as a share of the lowest bid among the proposals evaluated at the final stage, writes them to the history, and moves the opportunity to processing with the automatic note, in one transaction under a row lock (R-2.30, R-1.25, R-2.35). Only fully evaluated proposals are ranked (R-2.31), and a Team With Us opportunity in processing is awarded (R-1.49). The score-column migration to double precision keeps existing values. The one raw query takes its table name from a fixed ternary and passes the id as a parameter. Nothing under tests/acceptance changed. There is no secret or personal data in the code or logs. Unit and backend end-to-end tests cover the new rules and the store's seams. The backend timeout increase is justified in its comment. The ruling would change if a later verify result were stale or failing for this slice, or if the price score were found to count proposals out of contention.

**Conditions:**
none
