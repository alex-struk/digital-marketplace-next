---
stage: "build"
title: "build slice 21"
at: "2026-10-04T21:12:29.549Z"
cost: 1.0121896
turns: 34
session: "5deba2fd-313d-4c74-800a-bf571295685e"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

I changed nothing in this revision, because the ruling that returned slice 21 gives this stage nothing to fix.

**What the ruling said.** All three criteria the slice answers for pass: R-6.6, R-6.13 and R-6.19. That covers the email notification reference at `/admin/email-notification-reference`, the guarantee that every message builder is in the reference, the not-found answer to anyone who is not an administrator, and the caching fix under `/admin`. Verification still fails, but only on R-2.3, which this slice does not touch. In that test, the step that reads the proposal's status on the proposal edit page came back empty. The ruling found the empty read was caused by the test adapter, not the application, and sent that fix to the bind-adapter stage.

**What I checked.** I opened the saved outline of the page at the moment R-2.3 failed (`.sdlc/evidence/slice-21/R-2.3.txt`). It agrees with the ruling. Under the level-1 heading, the page shows the term "Status" with the definition "Submitted", next to "Submitted", "Proposal ID" and "Opportunity ID". The application is drawing what the criterion asks for, so changing the application would mean changing work this slice is not answerable for. I left the adapter's fix to the stage it was sent to. The adapter lives under `tests/` in any case, which this stage may not write.

**Checks.** Dependencies were not installed in this workspace, so the first run of `npm --prefix app run check` stopped because the TypeScript compiler was missing. After `npm --prefix app ci`, it passes: typechecks across every package and all unit test files. That includes the frontend suite (529 tests in 31 files) and the test that fails if any message builder under `src/mail/notifications` is missing from the reference. The error lines in the output are logs from tests that exercise failure paths, and the command exits successfully.

**Still open.**
- **Approval:** a fresh verify run is needed, with R-2.3 passing once the adapter is corrected and slice 21's criteria still passing. Nothing in `app/` blocks it.
- **Known conflict:** the ruling notes that R-6.6 as written conflicts with R-6.16 (decision record 0067). The build follows R-6.16, and R-6.6's test passes regardless, so it does not block this slice.

The next slice will find nothing missing from this one.

## Fix turn

I changed one frontend unit test that I think made `npm --prefix app run check` fail now and then; I couldn't reproduce the failure, so that cause is not confirmed. The output I was given only shows jsdom's harmless warnings ("Could not parse CSS stylesheet", "Not implemented: …"), not which test failed. The full check passed several times here, including a frontend run with only two workers.

What stood out was the R-1.17 test in `app/frontend/tests/other-program-drafts.test.tsx`, "lets the team questions run to 101, positions 0 to 100, and no further". It took about 20 seconds when nothing else came close to that: the slowest other frontend test took 2.5 seconds and the slowest backend test about 1 second. It clicked "add question" 101 times on the create form, and every click redrew every question's five fields, so the work grew with the square of the count. That is the test most likely to run out of time on a slower or busier machine.

The test now opens a stored Sprint With Us draft that already has 100 team questions, on its Opportunity tab, where the editable form is shown. It checks that there are 100 questions and that the add button is enabled, clicks it once, then checks that there are 101 and the button is disabled. The rule tested is the same: 101 questions allowed and no more. The test's time limit went from 120 to 30 seconds, and its file now runs in about 6 seconds. The full check passed after the change. No application code was changed.

**Journal addition:** This revision changed only the test `app/frontend/tests/other-program-drafts.test.tsx`, because the check had failed while the output showed only jsdom's harmless warnings. The failure did not reproduce, so the cause is a strong guess rather than confirmed. The one outlier was the R-1.17 question-limit test, which took about 20 seconds because it clicked "add question" 101 times and each click redrew the whole list. It now starts from a stored draft with 100 questions, adds one, and checks that there are 101 and the add button is disabled. That keeps the limit it checks and cuts its time to well under a second. Its time limit dropped from 120 to 30 seconds, the full check passes, and no application code or other file was touched. The R-2.3 read on the proposal edit page was left alone, as the ruling assigned it to bind-adapter.