---
gate: G3
question: "Does slice 7 (Staff can draft, submit and publish a Code With Us opportunity) do what its criteria say?"
recommendation: "I made no changes to the application."
opened: 2026-10-01T10:59:38.028Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

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
