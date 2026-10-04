| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T09:36:29.659Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does slice 16 (Opportunities close at their deadline, and a Code With Us one is scored and awarded) do what its criteria say?

**Recommendation.** I made changes for both failures in the new ruling.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I made changes for both failures in the new ruling. Neither can be confirmed here, because the acceptance tests only run after this turn. The R-2.32 failure may also not be caused by the application at all; details below. `npm --prefix app run check` passes: the typecheck is clean, the backend has 729 passing tests and the frontend 464.

**R-1.27: the winner's contact details for a reader who may see scores.** In both failed cases the reader was an administrator. They followed the award to the proposal's own page, which showed the organization's name and the score but no way to reach the organization. The opportunity page already showed contact details, but staff reach the award through the proposal page, so nothing there showed who to contact.
- **Backend change:** the proposal record now includes the organization's contact name, email and phone, in all three programs. It goes only to readers the service already shows the score to: staff, and the vendor once the proposal has been awarded or passed over. Proposal lists don't include it.
- **Screen change:** the Proposal tab shows these as "Contact name", "Contact email" and "Contact phone" in the organization's section, on both the read-only page and the vendor's manage page.
- **Tests:**
  - The backend tests, which run against a real in-memory database, check that an administrator gets the seeded winner's contact (Blake Placeholder, org.owner@example.test, 250-555-0101) on Code With Us, and that the author gets it on Sprint With Us.
  - The same tests check that an undecided vendor gets no contact in either program.
  - The screen tests check that the details appear when the service sends them and stay hidden when it doesn't.
- The choice is written up in `docs/decisions/0061-the-winners-contact-person-on-its-proposal.md`.

**R-2.32 (and condition `build-slice-16#5`): the score on a decided proposal.** I'm not confident this one is fully fixed.
- **What the evidence shows:** the page the test ended on was the administrator's view of the Sprint With Us proposal. It already shows "Total score 87.5%" and "Rank 1 of 2", and the value sits on the element with the contract's test id `proposal-total-score`. The test still reported the member as "unbound", with a message saying the page "now offers administrato…" (cut off).
- **Best guess:** the test's lookup was recorded against an earlier build that had no total score, and it went stale once condition `build-slice-16#6` added the total. That lookup belongs to the test stage, not this one, and I can't change it.
- **What I changed anyway:** the read-only Sprint With Us and Team With Us page now also shows the vendor their scores, total and rank once the proposal is awarded or passed over, as the Code With Us page already did. Before a decision the vendor still sees no scores. A screen test covers this.
- **If it fails again with the same "unbound" message,** the lookup needs refreshing against the current build. The screen itself has the right test id with the score in it.

**Earlier conditions `build-slice-16#1`–`#4` (notices sent only as blind copies).** These are met by the previous revision, and the latest ruling no longer lists R-1.1 or R-2.36 as failing. I left them as they are.
- **Evaluators (#1, #2):** when an opportunity closes, each active evaluator on the panel gets their own message addressed to them alone. The subject names the opportunity: "A … Opportunity is Ready to Be Evaluated: <title>". A chair who doesn't evaluate is still left out.
- **Administrators (#3, #4):** when a proposal is withdrawn, each active administrator also gets their own addressed message, in every program.
- An existing backend test checks that an administrator is a visible recipient.

**Condition `build-slice-16#6` (total score on the staff page).** The weighted total and rank were already showing on the staff read-only page, labelled "Total score", as the evidence screenshot shows.

**What the next slice will find missing:** the opportunity page's "Successful proponent" section still shows only the email and phone, not the contact person's name. That person's name is now on the proposal page instead.

I didn't touch anything outside `app/` and `docs/decisions/`.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does slice 16 do what its criteria say, given verify's escalation after three failed builds? Ruling: return, addressed to bind-adapter, not build. Both remaining failures (R-2.32 in both cases, and R-1.27 for Sprint With Us with a reader who may see scores) come from one test step, proposalSwuView.totalScore, which threw 'unbound: proposal-swu-view.total_score'. The cause is the new app's adapter bindings file, tests/adapters/new/bindings.yaml lines 593 and 595, which marks total_score and rank on proposal-swu-view as unbound because 'the screen shows no score of any kind'. That was written against an earlier build. The page outline saved when R-2.32 failed (.sdlc/evidence/slice-16/R-2.32.txt lines 46-49) shows the administrator's Sprint With Us proposal page with 'Total score 87.5%' and 'Rank 1 of 2', and the build reports the contract's test id proposal-total-score on that element. R-1.27's contact-detail half now passes: the proposal tab read 'Contact name Blake Placeholder Contact email org.owner@example.test Contact phone 250-555-0101'. Only its score half fails, on the same unbound lookup, and the test accepts the winning proposal's total score as the place the score is shown. The build stage cannot change tests/adapters, so another build would not find out more. That is verify's point, and it decided this ruling. Earlier conditions: #1-#4 are met because R-1.1 and R-2.36 now pass; #6 is met because the total score is on the staff page; #5 is withdrawn from build and goes to bind-adapter. What would change the ruling: if bind-adapter's re-check on the current build finds no total score or rank on the Sprint With Us proposal page, the fault goes back to build. If the re-bound lookups let R-2.32 and R-1.27 pass, this proposal is approvable.

**Conditions:**
- addressed-to bind-adapter: tests/adapters/new/bindings.yaml records proposal-swu-view observations total_score (line 593) and rank (line 595), and questions_score, challenge_score, scenario_score and price_score, as unbound because 'the screen shows no score of any kind'. That was walked on an earlier build. On the current build, signed in as the administrator, /opportunities/sprint-with-us/00000000-0000-4000-a018-000000000001/proposals/00000000-0000-4000-a018-000000000101 has a 'Scores' region with Team questions 100%, Code challenge 80%, Team scenario 70%, Price 100%, Total score 87.5% and Rank 1 of 2, and the total carries the contract test id proposal-total-score (page outline .sdlc/evidence/slice-16/R-2.32.txt lines 36-49). The unbound total_score fails R-2.32 at tests/acceptance/proposals/R-2.32.spec.ts:51 and the Sprint With Us score check of R-1.27 at tests/acceptance/opportunities/R-1.27.spec.ts:100. Bind these observations against the current build, and walk proposal-twu-view's matching score observations again, since the same screen serves Team With Us.
- addressed-to bind-adapter: tests/adapters/new/bindings.yaml marks scoresheet_tab unbound on proposal-swu-edit (line 554) and proposal-twu-edit (line 650) because 'the vendor's proposal screen offers only Proposal and History'. The current build says that once a proposal is awarded or not awarded, the vendor's manage page has a Scoresheet tab with each stage's score, the weighted total and the rank. R-2.32 then reads the vendor's score and rank through proposalSwuEdit.totalScore and rank. Check these against the current build on a decided Sprint With Us proposal, for example 00000000-0000-4000-a020-000000000101 as the organization owner, so R-2.32's vendor half reads the screen as it now is.
- condition-met build-slice-16#1: R-1.1 passes in the verify result for build-slice-16-3 (tests/results/new/slice-16.json). Each active evaluator gets their own message from addressedToEach in app/backend/src/closing/deadline-closing.service.ts.
- condition-met build-slice-16#2: app/backend/src/closing/deadline-closing.service.ts sends the ready-for-evaluation notice through addressedToEach (app/backend/src/mail/message.ts), one message per active evaluator addressed to them alone. The subject names the opportunity: 'A <program> Opportunity is Ready to Be Evaluated: <title>'. Only panel members with evaluator = TRUE are read (prisma-closing.store.ts), so a chair who does not evaluate is still left out.
- condition-met build-slice-16#3: R-2.36 passes in the verify result for build-slice-16-3 (tests/results/new/slice-16.json).
- condition-met build-slice-16#4: ProposalNotices.withdrawn in app/backend/src/proposals/proposal-notices.ts sends the administrators' notice through addressedToEach, one addressed message per active administrator. Code With Us and the two team programs both call it.
- condition-withdrawn build-slice-16#5: the R-2.32 failure is the new app's adapter binding for proposal-swu-view.total_score, which was recorded as unbound against an earlier build. The current page shows 'Total score 87.5%' under the test id proposal-total-score (.sdlc/evidence/slice-16/R-2.32.txt lines 46-49). The build stage cannot change tests/adapters, so this ruling sends the fix to bind-adapter.
- condition-met build-slice-16#6: app/frontend/src/screens/proposal-team-view.tsx shows staff a 'Scores' region with the weighted 'Total score' and 'Rank', taken from the scoresheet the service returns. The page outline when R-2.32 failed shows 'Total score 87.5%' and 'Rank 1 of 2' for the administrator (.sdlc/evidence/slice-16/R-2.32.txt lines 36-49).
