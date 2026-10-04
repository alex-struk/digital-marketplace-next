---
gate: G3
question: "Does slice 16 (Opportunities close at their deadline, and a Code With Us one is scored and awarded) do what its criteria say?"
recommendation: "I fixed the one thing the ruling sent back, R-2.15."
opened: 2026-10-04T10:30:02.392Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does slice 16 (Opportunities close at their deadline, and a Code With Us one is scored and awarded) do what its criteria say?

**Recommendation.** I fixed the one thing the ruling sent back, R-2.15.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I fixed the one thing the ruling sent back, R-2.15. A vendor can now open the Code With Us proposal create page for an opportunity that has closed. When they submit, they see the service's refusal: "This opportunity is no longer accepting proposals." The full `npm --prefix app run check` passes: the typecheck plus 729 backend and 467 frontend tests, along with the smaller packages. I could not run the acceptance tests or look at the page in a browser.

**What was wrong.** The create screen (`app/frontend/src/screens/proposal-cwu-create.tsx`) showed "Page not found" for any opportunity that was not Published. That did no harm until this slice added the deadline hook, which closes a lapsed opportunity on the first `/api` request. After that, a vendor reaching the create page always found it already closed, so the refusal the criterion asks for never showed. The backend already refuses correctly (`cwu-proposals.service.ts:149` and `:308`), so I made no backend change.

**What I changed:**
- **Create page.** It now shows "Page not found" only when the service doesn't return the opportunity or it is still a draft or under review. An opportunity that is in evaluation, or Published but past its deadline, still shows the form.
- **Form** (`proposal-cwu-form.tsx`). It takes a new optional `accepting` setting, true by default. The create page sets it from the shared rule for whether an opportunity still accepts proposals. When it is false, Submit skips the form's own field checks and goes straight to the terms dialog and then the service. The vendor therefore sees the service's refusal in the existing refusal message, under "Your proposal was not created", instead of a list of blank fields. The manage page already worked this way for a draft past its deadline.
- **Sprint With Us and Team With Us.** Their create screens are untouched and still hide a closed opportunity, as the criterion says.

**Tests.** In `app/frontend/tests/proposals.test.tsx` I added one test that runs twice: once with an opportunity in evaluation and once with one still Published but past its deadline. Each time it checks that the form appears, that Submit goes through the terms dialog and sends a submitted proposal, that the refusal text is shown, and that "Page not found" is not. A second new test checks the page is still missing when the service doesn't return the opportunity.

**Left alone.** The R-4.2 condition belongs to the stage that writes the tests, not to this one. That test counts every message in the mail catcher after a person with no email address signs in. It should look only for a welcome message, because the closing notices sent on that sign-in are correct behaviour. Nothing in the application changes for it.

The 12 criteria this slice answers for are otherwise unchanged. The only behaviour difference is on the Code With Us create screen.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does slice 16 do what its criteria say, given verify's escalation after three failed builds? Ruling: return, addressed to bind-adapter; build owes nothing further. The R-2.15 condition is met: R-2.15 is rechecked against tree bff4988 and no longer regresses. R-4.2 also passes now that its test was regenerated (derive-tests-users-stale-8). All 12 claimed criteria pass. The verdict is fail on one new regression, R-4.20 (slice 4): tests/acceptance/users/R-4.20.spec.ts:40 read userProfile.statusBadge() as 'Inactive' right after confirmActivationChange(). The page outline captured at the failure (.sdlc/evidence/slice-16/R-4.20.txt) shows the same profile with 'Status: Active' and 'Ellis Placeholder's account has been reactivated. They have been told by email.', so the application reactivated the account and said so. The fault is in the new app's adapter. confirmActivationChange (tests/adapters/new/index.ts:6278) clicks the dialog's confirm and returns without settling, unlike toggleAdminPermission, which settles after the click. statusBadge then reads the screen before the PUT has answered. This slice made that latent race visible: its deadline hook (app/backend/src/application.ts) makes every /api request wait for a closing run across three programs, and compose sets DEADLINE_HOOK_INTERVAL_MS to 0, so each request runs those queries. That is a correct behaviour of R-1.1, not a defect, and it can be tuned without changing what any criterion asks. The build stage cannot change tests/adapters, so another build would fail the same way, which is verify's point and what decided this ruling. It is not escalated because no pipeline stage is broken: an existing stage can make the fix. What would change the ruling: if R-4.20 still reads 'Inactive' after the adapter waits for the activation change to land, the fault is the application's and goes back to build. If R-4.20 passes with the 12 claimed criteria still passing, this proposal is approvable as it stands.

**Conditions:**
- condition-met build-slice-16-4#1: app/frontend/src/screens/proposal-cwu-create.tsx no longer treats a closed or past-deadline Code With Us opportunity as missing, and proposal-cwu-form.tsx (accepting=false) sends the submission to the service, which shows the refusal 'This opportunity is no longer accepting proposals.'. R-2.15 is rechecked in tests/results/new/slice-16.json for build-slice-16-5 and is not among the regressions. The Sprint With Us and Team With Us create screens are unchanged.
- addressed-to bind-adapter: in tests/adapters/new/index.ts, userProfile.confirmActivationChange (line 6278) clicks the confirmation dialog's button and returns without waiting for the activation change to reach the page. toggleAdminPermission on the same screen settles after its click; this one does not. tests/acceptance/users/R-4.20.spec.ts:40 then reads userProfile.statusBadge() straight away and got 'Inactive', while the page outline taken at that failure (.sdlc/evidence/slice-16/R-4.20.txt) shows the profile of 00000000-0000-4000-8000-000000000205 with 'Status: Active' and the status message 'Ellis Placeholder's account has been reactivated. They have been told by email.'. The race became visible once every /api request began waiting for the deadline-closing hook. Make confirmActivationChange (and the same action on userProfileSelf) wait until the dialog has closed and the change has been answered, for example by settling or by waiting for the status message, so that a reading taken after it reflects the change. The same steps are used by R-4.14, R-4.30, R-4.31, R-3.7, R-3.8, R-3.27 and R-3.32.
