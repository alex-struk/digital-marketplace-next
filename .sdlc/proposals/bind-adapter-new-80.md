---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I fixed the race in the profile confirmation step."
opened: 2026-10-04T11:01:31.412Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I fixed the race in the profile confirmation step.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I fixed the race in the profile confirmation step. Nothing else in the binding changed. I could not typecheck or run it: this session was not allowed to run the TypeScript compiler, and I did not run the affected tests against the target.

**What was wrong.** `userProfile.confirmActivationChange` pressed the confirm button in the dialog and returned straight away. It didn't wait for the change to reach the page. Once every `/api` request began waiting for the deadline-closing hook, a status reading taken right after it, as in R-4.20, still saw the old status ("Inactive"). The page then went on to show "Status: Active" and the reactivation message.

**What I changed.** In `tests/adapters/new/index.ts`, after it presses the confirm button the method now:
1. waits up to 20 seconds for the dialog to close;
2. waits up to 20 seconds for the message the profile shows once the change is done (text matching "has been deactivated" or "has been reactivated", which is the wording the R-4.20 failure outline shows);
3. waits for the page to go quiet, the same way `toggleAdminPermission` does.

Each wait gives up quietly on timeout rather than failing the action itself. If the change is refused, the test's next reading reports what the page shows, not a timeout from this step. `userProfileSelf` gets the profile screen's members from the same builder (at `/users/me`), so the same fix covers it. That covers R-4.14, R-4.20, R-4.30, R-4.31, R-3.7, R-3.8, R-3.27 and R-3.32.

**What I did not do.** I did not open the browser this time. Checking the fix live would have meant deactivating or reactivating a seeded account, which changes the target's data. I also didn't need it to bind anything new: the wording I wait for comes from the failure outline the ruling cites. If the target's wording for deactivation differs from "has been deactivated", the dialog-closed and page-settled waits still apply, so that path is weaker but not broken.

`bindings.yaml` is unchanged: both members were already `bound` and still are. I touched nothing outside `tests/adapters/new/`.
