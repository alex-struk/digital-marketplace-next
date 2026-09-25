---
gate: G3
question: "Do these tests follow from the proposals criteria and from nothing else?"
recommendation: "I wrote tests for all nine proposals criteria, so none of them is still recorded as untestable."
opened: 2026-09-25T10:58:09.960Z
---

# Do these tests follow from the proposals criteria and from nothing else?

**Recommendation.** I wrote tests for all nine proposals criteria, so none of them is still recorded as untestable.

I wrote tests for all nine proposals criteria, so none of them is still recorded as untestable. I could not typecheck or run anything: both `tsc` commands were blocked because they needed approval. None of the nine files has been compiled or run against an application.

**What was written.** There is a new `tests/acceptance/proposals/<ID>.spec.ts` for R-2.14 (a rewrite), R-2.15, R-2.26, R-2.27, R-2.29, R-2.30, R-2.31, R-2.32 and R-2.33. Each starts with the two header lines at spec@05e88fb. I removed the eight entries for R-2.15 and R-2.26 to R-2.33 from `not-testable.yaml`, and added no new ones. Every test starts from the opportunity the seed now provides for that criterion. That removes what blocked most of them before: one seeded closed opportunity per program, used up by whichever test got to it first.

**R-2.14, rewritten for the ruling.** A test no longer fails just because no message appears. If the form won't let a step happen (submit stays unavailable, or the archived organization isn't offered as a choice), that counts as the refusal. After each attempt, the test checks that the opportunity's title is not on the vendor's own list of proposals. The test only waits for a reason to appear when a malformed email or phone number was typed and the submission actually went through. Each test publishes its own opportunity, and ends with one attempt that is accepted: a complete individual, or the vendor's own active organization. That proves the "not on the list" check really reads the list. I dropped the old step where the vendor names an organization they don't belong to. The form only offers the vendor's own organizations, so that step asserts a service property the screen can't show.

**Choices and limits a reviewer should know about:**
- **R-2.15:** the draft half checks that the proposal is still a draft after the vendor tries to submit it. The criterion's quoted message can't be read there, because the Code With Us proposal management screen has no refusal or error observation. The creation half reads the quoted message on the create screen whenever the attempt reaches the service.
- **R-2.26:**
  - The screen can't show a proposal's status, so the tests use its history: "evaluated" appearing there means the move to evaluated, and "87%" is checked in the same history.
  - Out-of-range scores (100.01, 101, -1, 87.125) are shown as refused only because nothing gets recorded. The screen has no observation for a refused score.
  - The author enters the scores as the public sector staff persona.
- **R-2.27 and R-2.33:** a proposal's state is read from its history, for the same reason as R-2.26. R-2.27 also checks the opportunity's history for the automatic-move note.
- **R-2.29:** after the chair finalises, each proposal's own history must mention the challenge stage if it was carried forward, and must not if it was left behind.
  - **Sprint With Us:** the top four are carried; the proposals scoring 12 and 17 are left behind. The 17 is below a question's minimum, so leaving it out shows the minimum at work, not just the ranking.
  - **Team With Us:** the top three are carried.
- **R-2.30:** passes if the higher bid's price score reads 50, its history mentions the price, and its history gains one more "evaluated" entry.
- **R-2.31:**
  - **Weights:** 25/40/15/20. They come from the seed SQL, not from a manifest handle, and no observation shows weights.
  - **Question score:** read as a percentage. If a screen shows it as points (for example "16/20"), the weighted-sum check will fail because of the test, not the application.
  - **Rank:** read on the proposal management screen by the administrator, because that is the only Sprint With Us page with a `rank` observation.
- **R-2.32:** before checking what the vendor sees, the administrator reads a total on the evaluation view. That shows the proposal really has been scored, which separates "withheld" from "never scored". There is one test for the vendor's proposal being awarded and one for it being passed over.

**Observations the contract lacks.** None of these blocked a test, but each forced a weaker reading:
- a refusal or error observation on `proposal-cwu-edit` and `proposal-cwu-view`, so the R-2.15 message and a refused R-2.26 score can be read directly;
- a `status` observation on `proposal-cwu-view`, `proposal-swu-view` and `proposal-twu-view`, so the evaluator's side needn't be read through history;
- a `rank` observation on `proposal-swu-view` and `proposal-twu-view` that an evaluator can read;
- the stated weights, shown on the opportunity's view or management screen, or named in the manifest for the later-stage opportunities.

I changed nothing outside `tests/acceptance`.
