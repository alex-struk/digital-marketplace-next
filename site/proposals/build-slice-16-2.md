| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T09:22:14.505Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does slice 16 (Opportunities close at their deadline, and a Code With Us one is scored and awarded) do what its criteria say?

**Recommendation.** I made the three application fixes the ruling asked for.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I made the three application fixes the ruling asked for. `npm --prefix app run check` passes: typecheck clean, 728 backend tests and 460 frontend tests. I couldn't watch these run against the acceptance suite, so whether the three failing criteria now pass will only be known at the next verify.

**R-1.1, panel case.** When a Sprint With Us or Team With Us opportunity closes at its deadline, the notice to its evaluation panel used to go out as one blind-copied message. That meant no evaluator was ever a visible recipient, so the suite's mail check, which finds a message by its visible recipient, found nothing for them. `app/backend/src/closing/deadline-closing.service.ts` now sends each active evaluator a message addressed to them alone, using a new helper `addressedToEach` in `app/backend/src/mail/message.ts`. That helper skips missing addresses and repeats. The subject now ends with the opportunity's title. A chair who doesn't evaluate is still left out (R-5.20), and the Code With Us author's notice is unchanged.

**R-2.36, withdrawal.** The administrators' copy of a withdrawal notice had the same blind-copy problem. `ProposalNotices.withdrawn` in `app/backend/src/proposals/proposal-notices.ts` now sends each active administrator their own message, in all three programs. The vendor's notice was already found and is unchanged. Large announcements, such as new-opportunity notices, still use blind-copied batches; only these two small staff notices changed.

**R-2.32, staff total score.** The read-only Sprint With Us and Team With Us proposal page (`app/frontend/src/screens/proposal-team-view.tsx`) now has a "Scores" section for staff, laid out as in the catalogue's "evaluated" story. It shows:
- each stage's score, with the right test ids;
- the weighted total, labelled "Total score" (`proposal-total-score`), or "Not yet calculated" until every stage is scored;
- the rank (`proposal-rank`) once there is one.

It reads the scoresheet the service already returns, and vendors don't see it on this page; they still see their result on the manage page once decided.

**Tests**
- The deadline-hook test now expects one message per evaluator, each addressed to them, and checks that the title is in the subject.
- A new `app/backend/tests/proposal-notices.test.ts` checks, for each program, that the vendor and each administrator get their own visibly addressed withdrawal message. It also covers `addressedToEach` itself.
- The closing-and-awarding end-to-end test now checks, against the real mail path, that the panel's and administrators' messages each have a single recipient and carry them in the visible `To:` line. I had to change it to wait for every message, because a panel or a set of administrators now produces several.
- Two new frontend tests check that staff see the total score and rank when a proposal is awarded or passed over, that a total not yet calculated says so, and that a vendor sees no scores on this page.

I also updated decision record `docs/decisions/0060-closing-scoring-and-awarding.md` to describe the per-person messages (and why they replaced the blind copy) and the new staff Scores section.

**Not done here, as the ruling directed:**
- **For the adapter stage:** reading the "Successful proponent" region for R-1.27, and binding the Enter score, Disqualify and Award controls for R-6.25, R-1.26, R-2.26, R-2.27, R-2.33 and R-2.34. The new Scores section adds test ids (`proposal-questions-score`, `proposal-challenge-score`, `proposal-scenario-score`, `proposal-price-score`, `proposal-rank`) that the adapter may want to bind too.
- **For the plan stage:** moving R-1.24 and R-2.5 to Slice 17, and R-2.35 to Slice 19. The closing hook still assigns the anonymous names and the first review stage.

**For the next slice:** there is still no screen to enter Sprint With Us and Team With Us stage scores; that work is Slices 17 and 19. Until then, the new Scores section shows whatever the service computes, and "Not yet calculated" for any total not yet produced.

_Ruled: return by runner:verify_
