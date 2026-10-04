| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T18:01:23.783Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does slice 19 (Sprint With Us and Team With Us proposals go through their challenge stages to an award) do what its criteria say?

**Recommendation.** I built slice 19, and all of it is in place.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I built slice 19, and all of it is in place. `npm --prefix app run check` passes: types are clean in all three packages, and the backend (836 tests), frontend (508) and migrations (16) all pass. I could not run the sandbox or look at a page, so the screens are proven only by component tests against a stand-in service.

**What was built, criterion by criterion**

- **R-2.28 (scoring one stage at a time):** stage scores are sent as `scoreCodeChallenge`, `scoreTeamScenario` and `scoreChallenge` on the proposal update route. The service checks the proposal before the opportunity, as the surface describes:
  - A proposal not carried into the stage gets a 401 with "You do not have permission to perform this action."
  - A proposal that is in the stage, while the opportunity stands at another stage, gets a 400 with "The opportunity is not in the correct stage of evaluation to perform that action."
  - On the read-only proposal page, each stage tab offers its score button only when the opportunity is at that stage and the proposal is in it. Otherwise the tab says the proposal "can be scored once" the opportunity reaches that stage.
- **Screening and R-1.42 (starting the team scenario):** on the Code challenge tab, a scored Sprint With Us proponent can be screened in to the team scenario or out again, only while the opportunity is at the code challenge. The manage page offers "Start team scenario" at that stage. It is refused, with the design's "All proponents must be scored first…" message, while anyone in the code challenge is unscored, and also refused if nobody is screened in.
- **R-1.25 and R-2.30 (move to processing, price scores):** after every stage score or disqualification, if nobody at the program's final stage is still waiting for a score, two things happen together:
  - Each proposal scored at the final stage gets a price score: the lowest bid as a percentage of its own, recorded in its history by the system.
  - The opportunity moves to processing with the automatic note.
  - A Sprint With Us bid is the total proposed cost. A Team With Us bid is each person's hourly rate weighted by their resource's target allocation.
- **R-2.31 (weighted total and rank):** these reuse the scoresheet from slice 16, so only fully evaluated proposals are ranked. The read-only page shows the rank as "1st", "2nd", as the surface describes.
- **R-1.49 (award out of processing):** the permitted-transition table and award path from earlier slices already allowed it. The Team With Us manage page in processing now offers "Award a proposal".
- **R-2.35 (history):** every stage score, screening and price score lands in the proposal's history with who, when and a note. It reads, for example, "Code challenge score entered: 90%" and "Price score calculated: 50%".
- **Screens:** the proposal page now has the catalogue's stage tabs. The manage page has Code challenge and Team scenario tabs (or a Challenge tab) listing the proponents in each stage with their scores.

**Unit tests added**
- The pure stage rules.
- A backend end-to-end file run against the real migrations and the acceptance seed. It covers the R-2.28 refusals on the seeded records, the R-1.42 refusals and start, the price score of 50 with a move to processing, the Team With Us score-then-award, and disqualifying the last proponent waited for.
- Frontend tests for the stage tabs, the score dialog, screening, the wrong-stage alert, rank and history labels, and the manage page's start and award actions.

**Choices worth reviewing** (recorded in `docs/decisions/0065`)
- **Score columns:** the stored stage and price scores were whole-number columns, which would have rounded two-decimal scores and every price score. I added a migration making them double precision and updated the Prisma schema to match.
- **Hidden buttons:** the design keeps each stage's score button visible and lets the service refuse a press at the wrong stage. I followed R-2.28 v2 and the surface instead, so the button is absent until the stage is reached. The wrong-stage alert still appears if the service refuses a score.
- **Rank wording:** the proposal page's rank now reads "1st" where slice 16 showed "1 of 2", so I updated two of slice 16's frontend tests to match. The vendor's Scoresheet tab still shows "1 of 2".
- **Permission message:** the contract never defines the "general permission message". I used "You do not have permission to perform this action." If the acceptance suite expects other wording, it is one constant, `NOT_PERMITTED` in `rules/team-evaluation.ts`.
- **Team With Us screening:** the two Team With Us screening tags are refused with an explanation, because finalising the consensus already carries the top three into the challenge.
- **Off-path stage starts:** `startCodeChallenge` and `startChallenge` outside the consensus stage are now refused as changes off the program's path rather than as "not yet available". It is still a 400 either way.

**Not built, and what the next slice will find**
- The Team questions and Resource questions tabs show each response beside its question but not each question's agreed score, because the proposal's answer doesn't carry per-question consensus scores.
- The awarded Sprint With Us and Team With Us opportunity still doesn't include the winner's weighted total as a score on its public view; decision record 0060 left that as an option.
- Slice 20 will find the proposal pages' "Printable copy" link with no page behind it yet, and no full report.

I changed nothing outside `app/` and `docs/decisions/`.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

The question is whether slice 19 (Sprint With Us and Team With Us proposals go through their challenge stages to an award) does what its criteria say. Verify recorded a current result against tree eab038a: six of the seven criteria pass (R-1.25, R-1.42, R-1.49, R-2.28, R-2.31, R-2.35) and R-2.30 fails, so the ruling is a return. The R-2.30 failure is the adapter finding no proposal export page at /opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/export. plan/tasks.md gives that printable copy to Slice 20, not this slice. R-2.30 says nothing about an export or printable copy: it asks only that the price score be the share of the lowest bid in contention, calculated when the last human-entered score is recorded, recorded in history, and that the proposal become fully evaluated. The test's own design reads the price score from several places and needs only one of them to show 50, and it wraps each read in readOrEmpty. But it calls proposalSwuExportOne.open outside that guard (spec line 52), so the absence of a page this slice was never asked to build fails the criterion. That is a test reaching past its criterion, not missing application work, and rebuilding cannot fix it. Nothing else in the diff argues for a return: the stage-score refusal order matches R-2.28, price scores and the move to processing are written in one locked transaction, and the new rules have unit and end-to-end coverage. The ruling would change to an approval once R-2.30's test is regenerated without depending on the export page and a verify run on this branch passes all seven criteria.

**Conditions:**
- test-overreaches R-2.30: the test opens the proposal's printable-copy/export page for the Sprint With Us proposal (proposalSwuExportOne.open, unguarded) and fails when that page is not served, but R-2.30 asks only that the price score be the bid's share of the lowest bid in contention as a percentage, calculated when the last human-entered score is recorded, recorded in the proposal's history, and that the proposal become fully evaluated; it never asks for an export or printable copy of the proposal, so the test must observe the price score without requiring that page to exist
