---
gate: G3
question: "Does slice 16 (Opportunities close at their deadline, and a Code With Us one is scored and awarded) do what its criteria say?"
recommendation: "I made no changes to `app/` or `docs/decisions/` in this revision."
opened: 2026-10-04T09:53:31.256Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does slice 16 (Opportunities close at their deadline, and a Code With Us one is scored and awarded) do what its criteria say?

**Recommendation.** I made no changes to `app/` or `docs/decisions/` in this revision.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I made no changes to `app/` or `docs/decisions/` in this revision. The ruling has nothing left for the build to do: both remaining failures come from the new app's adapter bindings file, which belongs to bind-adapter. The two conditions that go with it were filed for that stage, and I left them alone.

**The failures.** R-2.32 (both cases) and R-1.27's Sprint With Us score check both stopped at one lookup: `proposalSwuView.totalScore` threw "unbound: proposal-swu-view.total_score". The bindings file marks total_score, rank and the four stage scores as unbound because "the screen shows no score of any kind". That was written against an earlier build.

**What the current build shows.** The saved page outline for R-2.32 (`.sdlc/evidence/slice-16/R-2.32.txt`, lines 36–49) has the administrator's Sprint With Us proposal page with a "Scores" region:

| Score | Value |
|---|---|
| Team questions | 100% |
| Code challenge | 80% |
| Team scenario | 70% |
| Price | 100% |
| Total score | 87.5% |
| Rank | 1 of 2 |

The total score carries the contract's `proposal-total-score` test id. The vendor's side is in place too. `app/frontend/src/screens/proposal-team-edit.tsx` gives the vendor's manage page a Scoresheet tab next to Proposal and History, and it appears only once a proposal is awarded or not awarded. The unit tests in `app/frontend/tests/team-proposals.test.tsx` cover it from line 623: the tab shows the anonymous name, a total of 87.5% under `proposal-total-score` and the rank, and has no Scoresheet tab before a decision. So bind-adapter's re-check should find the total score and rank on both the staff page and the vendor's decided page. If it does not, the fault comes back to build.

**The check.** At first `npm --prefix app run check` failed with "tsc: not found", because this workspace had no installed dependencies. After `npm --prefix app install` it passes:
- 46 backend test files, 729 tests passed.
- 26 frontend test files, 464 tests passed.
- The whole check passed on a second run.

The error lines in the test output, such as "closing-failed" from the deadline closing and an undelivered welcome mail, come from tests that exercise those failure paths on purpose; none of them fail the check.

**What I could not do.** I could not re-bind the adapter or run the acceptance suite; neither is this stage's to do. Whether R-2.32 and R-1.27 now pass depends on bind-adapter binding these lookups against the current build. The next slice should find nothing missing from this slice's criteria beyond those bindings.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

The question is whether slice 16 does what its criteria say. All 12 claimed criteria pass against tree adfa76f, but the result is fail on two regressions this slice caused by making deadline closing real, and the escalation asks whether those are the application's or a test's. They differ. R-2.15 (slice 14) is the application's: the criterion refuses a Code With Us proposal created already submitted after the deadline with "This opportunity is no longer accepting proposals.", and it names hiding a closed opportunity from vendors as the barrier only for Sprint With Us and Team With Us. The test closes the opportunity first, as R-1.1 now makes inevitable, and the vendor's create page then shows "Page not found" (.sdlc/evidence/slice-16/R-2.15.txt) because proposal-cwu-create.tsx:64 treats any non-PUBLISHED opportunity as missing. That was harmless before the hook existed and now hides the refusal the backend already gives (cwu-proposals.service.ts:149). R-4.2 (slice 2) is the test's: the criterion withholds a welcome message from a person with no email address, but the test demands that the mail catcher holds nothing for anybody after that person signs in. It found 14, which are the closing notices R-1.1 and R-5.20 require the sign-in's first /api request to send. So this is a return to build for R-2.15 plus a test-overreaches filing for R-4.2. Neither is a pipeline fault, so this is not escalated. The ruling becomes an approval once R-2.15 passes and a regenerated R-4.2 test binds and passes, with the 12 claimed criteria still passing.

**Conditions:**
- R-2.15 regressed: now that the deadline hook closes a lapsed Code With Us opportunity on the first /api request, the vendor's create page at /opportunities/code-with-us/<id>/proposals/create renders "Page not found" (proposal-cwu-create.tsx:64 treats any status other than PUBLISHED as missing), so the refusal the criterion quotes is never shown. Let a vendor reach the Code With Us create screen for an opportunity that is closed or past its deadline, and show the service's refusal "This opportunity is no longer accepting proposals." when they submit it, as the backend already answers. Leave the Sprint With Us and Team With Us create screens hiding a closed opportunity, as the criterion says.
- test-overreaches R-4.2: the test asserts the mail catcher holds zero messages for anyone after a first-time person with no email address signs in, while the criterion asks only that no welcome message is attempted for that person; the closing notices R-1.1 and R-5.20 require, sent on that sign-in's first /api request, make the catcher hold 14 unrelated messages, so the test must look only for a welcome message rather than counting all mail.
