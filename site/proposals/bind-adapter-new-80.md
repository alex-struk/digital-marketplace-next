| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T11:01:31.412Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

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

## Ruling

**Verdict:** approve
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

The question is whether this revision binds the profile activation-change confirmation so that a reading taken after it reflects the change, without moving anything else in the adapter. Approve. The escalation says bind-adapter went past policy.loops.request on build-slice-16's requests. Of the five sends it lists, only #5 (request/build-slice-16-5#1, the confirmActivationChange race) is still flagged as untaken by the conditions check, so this revision is answerable for that one alone. That part of the account decided the ruling. The diff is 9 lines inside userProfile.confirmActivationChange (tests/adapters/new/index.ts:6278-6290). After the confirm click it waits for the dialog to close, then for the 'has been (de|re)activated' status message (the wording in the R-4.20 failure outline), then settles the same way toggleAdminPermission does. Each wait gives up quietly on timeout, so a refused change shows up in the test's next reading rather than as a timeout in the action. userProfileSelf spreads the same selfProfile builder (line 6668), so it picks up the fix too. bindings.yaml is unchanged and nothing outside tests/adapters/new/ moved. The runner's typecheck on d2a4440ff passed with no diagnostics. The fix has not been run against the target, so the deactivation wording is unconfirmed; where it differs, the dialog-hidden and settle waits still hold. What would change this: R-4.20 or the other dependent tests still reading the pre-change status after this step, or the change reaching beyond the confirmation step.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `d2a4440ff32e358ef7fe238502ce38da1b8b8bf6`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
