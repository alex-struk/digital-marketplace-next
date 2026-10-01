| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-01T10:59:38.028Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 7 (Staff can draft, submit and publish a Code With Us opportunity) do what its criteria say?

**Recommendation.** I made no changes to the application.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made no changes to the application. This return is addressed to the adapter stage, and it names nothing for this stage to fix.

**What I did:** The ruling reads the five failures against the application tree (a21fb0c) and puts each one down to the test adapter for the new target, not to the application:

- **R-1.7 and R-1.22:** the application refuses as the criteria ask. An anonymous visitor at the create page gets "Page not found", and a staff member is offered no Publish action. The failures come from the adapter throwing on a refusal, which the tests do not catch.
- **R-8.19 and R-8.25:** the application shows a file's download link only once the upload has finished. The adapter reads the row before the upload is done.
- **R-1.21:** the application shows "This opportunity is incomplete" inside the open tab's section, and the alert disappears if the page is reloaded. The ruling asks the adapter stage to find out whether its submit-for-review step pressed the control at all, or whether its reader reloaded the page.

All three conditions are filed for the adapter stage and I was told to leave them alone. The ruling also says the next return comes to this stage only if a corrected adapter still reads these criteria as failing against the same tree. So I kept the tree as it is and did not change how the incomplete alert or the attachment row behave. Changing either would move what the adapter stage is being asked to check.

**What I checked:** `npm --prefix app run check` failed at first with `tsc: not found`, because this workspace had no installed dependencies. After `npm --prefix app ci` it passes: typechecks clean, and unit tests pass in all three packages (16, 394 and 233 tests). The one error-level log line in that output is a mail-delivery failure that a test sets up deliberately; it checks that a failed delivery is quietly ignored. Nothing under `app/` or `docs/decisions/` was edited.

**Not done here:** The three adapter conditions, as filed:
1. Return quietly when a person is refused.
2. Wait for each upload to show its link or its error.
3. Read the incomplete alert without reloading the page, and report which cause it was.

R-1.51 has no test checking it, and the ruling did not rule on it. Nothing new is missing for the next slice beyond what the earlier slice 7 build already reported.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether slice 7 (staff draft, submit and publish a Code With Us opportunity) does what its criteria say. Verify is unbound on R-8.19 and R-8.25, so the ruling is a return. In both tests every Code With Us case passes: an attachment on a CWU draft is refused to a vendor and served once the opportunity is published, and the creator path also passes. The unbound cases are the Sprint With Us and Team With Us creation screens and the CWU proposal-create screen. The application answers 'Page not found' on all of them, and the plan and decision record 0030 put them in later slices (SWU/TWU opportunities in slice 10, proposals later). The tests do not overreach. R-8.19 says in so many words 'for all three programs alike', and R-8.25 names Sprint With Us opportunities and proposal attachments, so each test asks for what its criterion states. The build also did not fall short of what slice 7 asked for, because those screens are not slice 7's to build. What is wrong is the slice's claim: slice 7 claims two whole criteria that it can only partly exercise, and that belongs to plan. Nothing in the reviewed code needs changing. The CWU service, the rules module, the attachment read path, the blind-copy batching and the unit tests follow the criteria they cite, and no secrets or personal data appear. R-1.51's not-testable reason is real, and the backend end-to-end test shows the schema refuses a suspended state, so I would accept the slice with it unasserted. This ruling would change to an approval once verify is current and nothing fails: either the plan stops claiming the SWU/TWU/proposal clauses of R-8.19 and R-8.25 in slice 7, or it keeps those criteria for the slices that build those screens.

**Conditions:**
- addressed-to plan: Slice 7 claims R-8.19 and R-8.25 whole. Their acceptance tests also exercise attachments on Sprint With Us and Team With Us opportunities (R-8.19 says 'for all three programs alike') and on a Code With Us proposal (R-8.25), and creating any of those is built in later slices: SWU/TWU opportunity creation is slice 10 per decision record 0030, and CWU proposals come later. Verify for slice 7 against tree a21fb0c passed every Code With Us case of both tests and was unbound only on /opportunities/sprint-with-us/create, /opportunities/team-with-us/create and the CWU proposal-create screen. Move R-8.19 and R-8.25 so that each is claimed by the slice that builds the last of those screens (or by a later slice), and have slice 7 claim only what its Code With Us screens can exercise.
