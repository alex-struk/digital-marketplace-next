| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T08:58:18.782Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does slice 16 (Opportunities close at their deadline, and a Code With Us one is scored and awarded) do what its criteria say?

**Recommendation.** I built slice 16, and `npm --prefix app run check` passes: 16 migration tests, 724 backend tests and 458 frontend tests, stable over three full runs.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I built slice 16, and `npm --prefix app run check` passes: 16 migration tests, 724 backend tests and 458 frontend tests, stable over three full runs. I couldn't start the compose sandbox or open a browser here, so nothing was checked against the running stack or the acceptance suite.

**The deadline hook (R-1.1, R-1.24, R-2.5, R-5.20).** A hook now runs in front of every request under `/api` and `/status` (`backend/src/closing/`). It closes every published opportunity, in all three programs, whose deadline (4:00 p.m. Pacific on the day) has passed:
- Code With Us opportunities move to `EVALUATION`, the other two programs to `EVAL_QUESTIONS_INDIVIDUAL`, with the note "This opportunity has closed." and no author.
- Each submitted proposal moves to review. Sprint With Us and Team With Us proposals are named "Proponent 1", "Proponent 2" and so on; Code With Us proposals are not renamed. Drafts and withdrawn proposals are left alone.
- Each closure runs in its own transaction with a row lock, so two runs never close the same opportunity twice.
- Once a closure is saved, the Code With Us author is emailed "Your Code With Us Opportunity is Ready to Be Evaluated". For the other two programs the panel's evaluators are emailed as blind copies, and a chair who doesn't evaluate is left out.

Each program's run starts at most once per `DEADLINE_HOOK_INTERVAL_MS`. That is a minute when unset and `0` in compose, so the first request after a deadline closes the opportunity. Requests wait for the run they start or join. R-1.19's state values were already enforced by Slice 7's database constraints; this hook is what moves a lapsed opportunity out of Published.

**Scoring, disqualifying and awarding a Code With Us proposal.** The opportunity's author or an administrator does all three on the read-only proposal page, using the catalogue's dialogs and test ids:
- **Score (R-2.26):** out of 100, at most two decimals. A bad value is refused at the field and by the service. Entering one records an `EVALUATED` row and a "Score entered: 87%" history entry.
- **Disqualify (R-2.34):** needs a reason of 1–5,000 characters, which is kept in the history.
- **Move to processing (R-1.25, R-2.27):** after the last score, the opportunity moves to processing by itself with the specified note; drafts, withdrawn and disqualified proposals aren't counted.
- **Award (R-1.26, R-2.33):** marks the rest in contention not awarded and awards the opportunity.
- **Winner on the public page (R-1.27):** everyone sees the name; only the author and administrators see the contact details and score.
- **Vendor's view (R-2.32):** the vendor sees their score and rank ("2 of 3") only once their proposal is awarded or not awarded.

**Notices (R-2.36, R-6.25).** These apply in every program:
- a confirmation to the vendor when they submit;
- a withdrawal notice to the vendor and, as blind copies, to every administrator;
- an award notice to the winner;
- a decision notice to each proponent passed over. It's titled with the opportunity's title, opens "Awarded to: <winner>" (an em dash if none), and links to sign in and see their score.

The withdraw dialogs now say the notice will be sent, as the stories do.

**Built beyond the plan's reading.** The seed puts R-1.26's and R-2.32's starting points on Sprint With Us opportunities (`swuProcessingB`, `swuProcessingA`), so the Code With Us work alone wouldn't satisfy their tests. For Sprint With Us and Team With Us I added:
- award and disqualify on the service and on the read-only proposal page;
- the winner's name on their public pages;
- a Scoresheet tab on the vendor's manage page once decided: the anonymous name, each stage's score, the weighted total and the rank. These are computed from scores already stored; nothing new is written.

Slice 19 owns entering the stage scores, the price-score formula and the staff view of them. If its weighted total differs from mine, `teamScoresheet` in `backend/src/rules/proposal-evaluation.ts` is the one place to change. Two things are deliberately left to the stage work: no score is shown for those programs' winners, and disqualifying doesn't move those opportunities on.

**The `/status` page.** The surface and catalogue draw `/status` as a page, but a browser got the service's bare "OK". The web server (and the Vite dev proxy) now gives a browser's page request the app, whose Service status screen calls the service's `/status` and so still runs the hook. Every other request still reaches the service unchanged.

**Tested.**
- An end-to-end file over the real migrations and seed covers closing in all three programs, who is told, scoring, disqualifying, moving to processing, both kinds of award, the mail contents, the winner's visibility, rank, and withdrawal.
- Unit tests cover the rules and the hook's throttle.
- Frontend tests cover the dialogs, the Scoresheet tab, the winner section and the status screen.
- Two existing tests changed: one end-to-end test now expects the new submission confirmation, and every new message was added to the service-wide mail test.

**Test runner change.** I capped the backend's parallel test workers at half the cores. Before that, an untouched end-to-end file timed out in about half the full runs once mine was added.

Choices and answers are written up in `docs/decisions/0060-closing-scoring-and-awarding.md`, and `app/README.md` has a new section. I edited nothing outside `app/` and `docs/decisions/`.

**What the next slice will find missing.** The Sprint With Us and Team With Us evaluation stages (individual, consensus, challenge and scenario screens, and their scoring) are still unbuilt. The anonymous names show only on the vendor's Scoresheet tab until those screens exist.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does slice 16 do what its criteria say? The verify result is fail against the current tree 442e566: 2 of 15 claimed criteria pass (R-5.20, R-1.19), so approval is not open. I sorted each failure against its evidence page, the adapter in tests/adapters/new and the plan. (1) R-1.1's panel case and R-2.36's withdrawal case belong to the application. DeadlineClosing.tell and ProposalNotices.withdrawn send the evaluator and administrator notices as blind-copy batches (blindCopiedBatches), and the suite's mail fixture finds a message by visible recipient only, so neither the evaluators nor administratorOne ever receives one it can find. The vendor's own withdrawal notice, sent visibly, was found. (2) R-2.32 belongs to the application. The administrator's read-only Sprint With Us proposal page (proposal-swu-view) draws no total score, although the service already returns the scoresheet to staff. (3) R-1.27 belongs to the adapter. .sdlc/evidence/slice-16/R-1.27.txt shows a region 'Successful proponent' whose paragraph is 'Northern Pines Digital Ltd.', but opportunityCwuView.successfulProponent looks only for an 'Awarded to ...' line or a definition term, so it read ''. Its bindings.yaml comment still says the awarded page names no winner. (4) The unbound results on R-6.25, R-1.26, R-2.26, R-2.27, R-2.33 and R-2.34 each say the page now offers a control (Enter score, Disqualify, Award) that the binding has not seen, so they belong to bind-adapter, not to the build. (5) R-1.24, R-2.5 and R-2.35 are unbound on screens this slice was not asked to build: R-1.24 and R-2.5 on the individual evaluation list (evaluation-individual-list-swu/twu, Slice 17) and R-2.35 on the code challenge score (Slice 19). This is the same placement problem the plan already resolved for R-5.16 and R-1.19, so it goes to plan. Separately, I read the hook, closing store, scoring/award rules and notices against R-1.1, R-1.25, R-1.26, R-2.26, R-2.27, R-2.33 and R-2.34. They are sound: row-locked closure with a per-program throttle, contention rules, the em-dash default in R-6.25, no secrets in code or logs, and unit and end-to-end tests at the new seams. Nothing outside app/ and docs/decisions changed. What would change the ruling: a current verify result with nothing claimed failing, after the build makes the three application fixes, bind-adapter rebinds the four items above, and plan re-places R-1.24, R-2.5 and R-2.35.

**Conditions:**
- R-1.1, in the case "a Sprint With Us or Team With Us opportunity is announced as ready for evaluation to the evaluators on its panel": Error: expect(received).toBe(expected) // Object.is equality — Expected: true — Received: false — at tests/acceptance/opportunities/R-1.1.spec.ts:132 — its last steps: scheduledTransitionTrigger.open() at /status → scheduledTransitionTrigger.runPendingTransitions() at /status — the page as it failed: .sdlc/evidence/slice-16/R-1.1.png, .sdlc/evidence/slice-16/R-1.1.txt
- app/backend/src/closing/deadline-closing.service.ts: the ready-for-evaluation notice reaches each panel evaluator only as a blind copy (blindCopiedBatches), so no evaluator is a visible recipient of any message. Send each active evaluator their own message addressed to them alone, and name the opportunity's title in the subject or the opening line. Keep the chair who does not evaluate excluded (R-5.20).
- R-2.36, in the case "withdrawing a proposal sends a notice to the vendor and to every administrator": Error: expect(received).toBeGreaterThan(expected) — Expected: > 0 — Received:   0 — at tests/acceptance/proposals/R-2.36.spec.ts:97 — its last steps: proposalCwuCreate.acceptProgramTerms() at /opportunities/code-with-us/9f709fc5-8057-410e-a330-e077b3e8290b/proposals/create → proposalCwuCreate.acceptAppTerms() at /opportunities/code-with-us/9f709fc5-8057-410e-a330-e077b3e8290b/proposals/create → proposalCwuCreate.submitProposal({proposalText}) at /opportunities/code-with-us/9f709fc5-8057-410e-a330-e077b3e8290b/proposals/a0a178df-bb36-4a5c-918e-702d5140c69e/edit → proposalCwuEdit.withdrawProposal() at /opportunities/code-with-us/9f709fc5-8057-410e-a330-e077b3e8290b/proposals/a0a178df-bb36-4a5c-918e-702d5140c69e/edit — the page as it failed: .sdlc/evidence/slice-16/R-2.36.png, .sdlc/evidence/slice-16/R-2.36.txt
- app/backend/src/proposals/proposal-notices.ts: ProposalNotices.withdrawn sends the administrators' notice only as blind-copy batches, so no administrator is a visible recipient. Send each active administrator their own message addressed to them alone, in every program.
- R-2.32, in the cases "their proposal awarded" and "their proposal passed over": Error: the proposal carries no score — Expected pattern: /\d/ — Received string:  "" — at tests/acceptance/proposals/R-2.32.spec.ts:51 — its last steps: signIn(persona administrator) at /dashboard → proposalSwuView.open({opportunityId, proposalId}) at /opportunities/sprint-with-us/00000000-0000-4000-a018-000000000001/proposals/00000000-0000-4000-a018-000000000101 → proposalSwuView.totalScore() at /opportunities/sprint-with-us/00000000-0000-4000-a018-000000000001/proposals/00000000-0000-4000-a018-000000000101 threw "unbound: proposal-swu-view.total_score — the proposal's screen offers no total score: walked on the current build as the administrator, from the proponent links of the opportunity's Proposals section…" — the page as it failed: .sdlc/evidence/slice-16/R-2.32.png, .sdlc/evidence/slice-16/R-2.32.txt
- app/frontend/src/screens/proposal-team-view.tsx: the read-only Sprint With Us and Team With Us proposal page shows staff no total score. Draw the weighted total (and rank) from the scoresheet the service already returns to the administrator and the opportunity's author, labelled as the proposal's total score.
- addressed-to bind-adapter: R-1.27: opportunityCwuView.successfulProponent (tests/adapters/new/index.ts, the Code With Us view member near line 7378) looks only for an 'Awarded to <name>' line or a 'Successful proponent' definition term, so it read ''. On /opportunities/code-with-us/00000000-0000-4000-a008-000000000001 the page draws a region named 'Successful proponent' (heading level 2) whose paragraph is 'Northern Pines Digital Ltd.' (.sdlc/evidence/slice-16/R-1.27.txt line 34). Read the name from that region, on the Sprint With Us and Team With Us views as well. Also correct the bindings.yaml comment saying the awarded page names no winner.
- addressed-to bind-adapter: R-6.25, R-1.26, R-2.26, R-2.27, R-2.33, R-2.34: verify reports the read-only proposal pages now offer controls this binding has not seen: on proposal-cwu-view 'Enter score', 'Disqualify' and 'Award' for the administrator and the opportunity's author; on proposal-swu-view 'Award'; on proposal-twu-view 'Disqualify'. Bind enter_score, disqualify_proposal and award_proposal on those screens, including the dialogs each opens.
- addressed-to plan: R-1.24 and R-2.5 are claimed by Slice 16, but their tests read the anonymous proponent names on evaluation-individual-list-swu and evaluation-individual-list-twu (the individual evaluation section of /opportunities/<program>/:id/edit?tab=evaluation). Verify of build-slice-16 found both unbound there because that screen is Slice 17's. Place them in Slice 17, as R-5.16 was placed for the same reason; the hook that assigns the names stays built in Slice 16.
- addressed-to plan: R-2.35 is claimed by Slice 16, but its test enters a code challenge score on proposal-swu-view (proposal-swu-view.score_code_challenge), which verify of build-slice-16 found unbound. Code challenge scoring is Slice 19's. Place R-2.35 where its test can first run.
