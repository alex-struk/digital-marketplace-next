---
gate: G3
question: "Does slice 16 (Opportunities close at their deadline, and a Code With Us one is scored and awarded) do what its criteria say?"
recommendation: "I made no change to the application in this revision."
opened: 2026-10-04T11:05:50.921Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does slice 16 (Opportunities close at their deadline, and a Code With Us one is scored and awarded) do what its criteria say?

**Recommendation.** I made no change to the application in this revision.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I made no change to the application in this revision. The ruling sent the proposal back to the adapter-binding stage and says the build stage owes nothing further, so `app/` and `docs/decisions/` are exactly as they were in tree bff4988.

**Where things stand:** the ruling confirms that all twelve criteria this slice answers for pass: R-1.1, R-1.19, R-1.26, R-1.27, R-2.26, R-2.27, R-2.32, R-2.33, R-2.34, R-2.36, R-5.20 and R-6.25. The R-2.15 regression from earlier builds is cleared, and R-4.2 passes now that its test was regenerated.

**The one failure left, R-4.20, is not the application's fault.** The page captured at the failure shows the account reactivated and the confirmation message on screen. The test reads the status badge too early. The adapter step that confirms an activation change clicks the dialog's button and returns without waiting for the server to answer. This slice's deadline hook makes every `/api` request first run the closing check across all three programs (compose sets `DEADLINE_HOOK_INTERVAL_MS` to 0), which made each request slower and exposed that race. The ruling calls this correct behaviour for R-1.1.

**What I considered and decided against:** I could have made requests faster, for example by raising that interval in compose so the hook doesn't run its queries on every request. That would only hide the race in the adapter, and nothing in the ruling asks for it. It would also mean a lapsed opportunity could stay open past its deadline for one interval, which is weaker than what R-1.1 asks. The fix is the adapter's, already filed with that stage, and that step lives under `tests/adapters`, which this stage can't write.

**Check:** with dependencies installed, `npm --prefix app run check` passed: typecheck clean, all unit tests in every package green. An earlier run in this workspace failed only because the packages weren't installed yet (`tsc` not found); after `npm ci` it passed. The error lines in the output are logged by tests that deliberately exercise failure paths, such as a closing run that hits a database error or mail that can't be delivered. They are not failures.

**For the next stage:** if R-4.20 still reads "Inactive" once the adapter waits for the activation change to land, the fault is in the application and should come back here. Otherwise, by the ruling's own terms, the proposal can be approved as it stands. The next slice will find nothing missing from this one.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does slice 16 (opportunities close at their deadline; a Code With Us one is scored and awarded) do what its criteria say? Ruling: approve. The verify result is current for this proposal (app tree bff4988 matches the branch) and every one of the 12 claimed criteria (R-1.1, R-1.19, R-1.26, R-1.27, R-2.26, R-2.27, R-2.32, R-2.33, R-2.34, R-2.36, R-5.20, R-6.25) passes. No re-checked criterion has a failing or unbound row; R-4.20, the failure in the last round, passes now that its binding waits for the activation change, and R-2.15 and R-4.2 pass. Reading the code against the criteria: the deadline hook runs in front of /api and /status, closes each lapsed published opportunity under a row lock so two runs close it once, records the note 'This opportunity has closed.', moves submitted proposals to review (with Proponent N names for SWU/TWU only), notifies the CWU author or only the panel's evaluators, skips inactive accounts, and logs failures without failing the request. CWU scoring enforces 0-100 with at most two decimal places and records the exact history note. The move to processing ignores draft, withdrawn and disqualified proposals. A disqualification needs a reason of 1-5,000 characters. Awarding runs in one transaction, marks only the proposals still in contention as not awarded, and the award and decision notices name the winner or an em dash. The winner's contact details and score, and a vendor's own score and rank, are gated as the criteria say. Raw SQL builds table names from constants only and passes ids as parameters; logs carry only event names and error types, with no personal data or credentials. Unit and end-to-end tests cover the new seams (the closing hook, the evaluation rules, the notices, the full close-score-award flow). What would change the ruling: a stale or failing verify result for this code, or a regression in an earlier slice's criterion.

**Conditions:**
none
