---
gate: G3
question: "Do the revised opportunities tests now follow from their criteria and from nothing else?"
recommendation: "I rewrote the three opportunities tests the reviewer returned."
opened: 2026-09-14T00:29:00.958Z
---

# Do the revised opportunities tests now follow from their criteria and from nothing else?

**Recommendation.** I rewrote the three opportunities tests the reviewer returned.

I rewrote the three opportunities tests the reviewer returned. I changed nothing else: every other file in `tests/acceptance/opportunities/` is untouched, and so is `tests/acceptance/not-testable.yaml`. The three changed files keep their criterion versions and the spec sha, which `spec/criteria-index.json` confirms is still `7a0d4769…`. Their "derived" date is now 2026-09-13. I could not typecheck the changes: running `tsc` on the test project needed approval that wasn't given, so the next stage should run it.

**Condition 1, R-1.1.** I removed the test that counted the author's mail before and after the closure trigger. The file comment now says the author notification is not asserted, and why: closure happens only once, and any request under /api or /status can set it off, not just the trigger the test calls. So there's no way to pin down when the notice goes out, and comparing counts before and after would fail a system that works correctly. The status test and the proposal-review test are unchanged.

**Condition 2, R-1.18.** None of the three cases reads a field error right after adding a resource any more. Each one now does the following, as R-1.13 and R-1.16 do:
- signs in as the administrator and adds the one faulty resource: allocation 0, allocation 101, or an unrecognised service area;
- completes the rest of a Team With Us opportunity: a resource question, an evaluation panel from the seeded users, a budget, weights totalling one hundred, and dates;
- submits it with `publish`, so it is not a draft, and only then expects `fieldError()` to report the rejection.

**Condition 3, R-1.37.** I removed the test asserting that the administrator gets a notice. The comment now says that notice isn't asserted: the criterion doesn't say how it's addressed, and the mail fixture only searches visible recipients, so a blind-copied notice wouldn't be found. It points to R-1.34 to R-1.36, which skip their group notices for the same reason. The author-confirmation test is unchanged. The file still has a test, so R-1.37 gets no not-testable entry.

**Condition 4 (non-blocking).** I didn't act on this one; it asked for a later recheck, not a change here. R-1.1, R-1.19 and R-1.24 still expect the seeded closed opportunities to be at their first evaluation stage. That holds only while no domain that runs earlier moves those records on, so it should be checked again when the evaluation domain is re-derived against the same seeds.

Nothing I needed was missing from the surface. The one gap these fixes exposed is in the mail fixture: it can't find blind-copied messages. That now affects R-1.34 to R-1.37. If the contract gave `mail` a way to search every recipient, including blind copies, all four group-notice claims could be asserted.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Do the revised opportunities tests now follow from their criteria and from nothing else? Approved. Against the returned revision, only R-1.1, R-1.18 and R-1.37 changed under tests/acceptance/opportunities/, and the R-1 not-testable entries are unchanged (one entry is only re-wrapped). All three conditions are met. R-1.1 no longer counts the author's mail before and after closure, and its comment gives the real reason the notice can't be asserted: closure happens once and any /api or /status request can trigger it. The status and proposal-review tests remain. R-1.18 now builds a complete Team With Us opportunity that is not a draft (question, panel, budget, weights totalling one hundred, dates), publishes it with the one faulty resource, and reads fieldError() only after that submission, which matches the criterion's given and when. R-1.37 drops the administrator-notice assertion for the same blind-copy limitation of the mail fixture used in R-1.34 to R-1.36, and keeps the author confirmation, which the criterion states. The runner's typecheck reports no diagnostics under acceptance/opportunities/. The failures elsewhere belong to other domains. Tier is STANDARD and no residual risk is marked unaccepted, so there are no grounds to escalate. The ruling would change if the opportunities tests gained a typecheck diagnostic, or if the seeded closed opportunities were found to be past their first evaluation stage when this domain runs.

**Conditions:**
- Non-blocking, carried forward: R-1.1, R-1.19 and R-1.24 expect the seeded closed Sprint With Us and Team With Us opportunities to be at their first evaluation stage. Recheck this when the evaluation domain is re-derived against the same seeds, because a domain that runs earlier could move those records on.
- Non-blocking: R-1.34 to R-1.37 leave their group notices unasserted because the mail fixture searches visible recipients only. If the contract gains a way to search every recipient, including blind copies, these notices should be re-derived.

### Runner-owned typecheck evidence

Proposal revision: `8c6b79008bba860db55908c1c97bf7c68ccd99cd`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    acceptance/users/: 89 diagnostics
    acceptance/evaluation/: 19 diagnostics
    acceptance/files/: 13 diagnostics
    acceptance/notifications/: 13 diagnostics
