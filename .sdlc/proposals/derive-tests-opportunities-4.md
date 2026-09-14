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
