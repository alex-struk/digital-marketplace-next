---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "I supplied what both owed criteria lacked (R-1.1 and R-5.27), and the oracle started cleanly on the first attempt."
opened: 2026-10-04T15:32:09.773Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Is this the contract the tests will act through?

**Recommendation.** I supplied what both owed criteria lacked (R-1.1 and R-5.27), and the oracle started cleanly on the first attempt.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I supplied what both owed criteria lacked (R-1.1 and R-5.27), and the oracle started cleanly on the first attempt.

**The contract as it stands.** It was already mature when this run began; this is its 45th proposal. I kept every page, persona and seed record and deleted nothing. The only API description file is `spec/contract/openapi.yaml`, which was recovered from the old application's own description files in `src/back-end/docs/`. It already covered the panel-change request on both programs, so it needed no change, and neither did `observables.yaml`, the seed SQL files or the oracle override (`.sdlc/oracle/compose.yml`).

Sign-in works the same way as before:
- **Oracle (session-route):** vendors sign in at `/auth/createsessionvendor/<n>`, which finds the seeded account whose identity-provider id is `test-vendor-<n>`. Public sector staff sign in at `/auth/createsessiongov` and the administrator at `/auth/createsessionadmin`.
- **Rebuilt target (sandbox-idp):** each persona signs in with a username equal to its oracle identity-provider id.
- **Anonymous visitor:** `sign_in: null`.
- **Unavailable on the oracle**, with a reason recorded for each: the second administrator, the second staff member, the three first-time sign-in personas, and the self-reactivating vendor. The old application only has fixed accounts and no identity provider.

**R-1.1 (every proposal moves to review when an opportunity closes).** Only a proposal's own proponent can read the status of a Sprint With Us or Team With Us proposal. Nobody could sign in as the owner of the third proposal on each closed opportunity (`proposals.sprintWithUsThree` and `proposals.teamWithUsThree`).
- **Added:** a persona, `third-proponent`, for `users.proponentThree`. It signs in at `/auth/createsessionvendor/12` on the oracle and as username `test-vendor-12` on the rebuilt target. That account already exists in the rebuilt target's identity-provider setup, so the build stage owes nothing.
- **Not added:** a status reading for staff on the proposal view pages. I couldn't confirm the old application shows staff one, and the persona route needed no new claim about the screens.
- **Manifest:** `users.proponentThree` now names this persona.

**R-5.27 (the newest version's panel decides when individual evaluation moves to consensus).**
- **What the old code allows:** in individual evaluation, an opportunity's questions are frozen, because they can only be edited up to Published. The evaluation panel can still be changed, and saving it writes a new opportunity version. So changing the panel is the one way to test the criterion's note, and changing the questions isn't possible at that stage.
- **Why the writer couldn't reach it:** the panel pages already existed, but they lacked the "Edit" press the old tab needs before anything can change. They also didn't say how a member is named or that they work during individual evaluation.
- **Added:** a `start_editing` action on `evaluation-panel-swu` and `evaluation-panel-twu`. Both pages now explain that the old UI lists each person as "Name (email)", that a newly added member is an evaluator and not the chair, and that saving publishes a new version.
- **Third evaluator:** `users.staffPanelEvaluator`, which is seeded and sits on no panel. With it added, the original two evaluators' 24 scores should no longer be enough to move the opportunity on.

**Oracle check.** `oracle up` ran all 78 migrations, loaded the seed and started four copies. I checked it through the application itself:
- Signed in as `users.proponentThree` at `/auth/createsessionvendor/12` and read back its seeded proposal, status `SUBMITTED`.
- Called `/status`, which closed the seeded Sprint With Us opportunity (`opportunities.closedSprintWithUs`) into individual team-question evaluation.
- As administrator, added `users.staffPanelEvaluator` to that opportunity's panel. The service accepted it (HTTP 200), and the opportunity stayed in individual evaluation with three members.

I didn't check that 24 submissions then fail to move it on; that is the test's job. `oracle down` ran afterwards.

**Gaps.** None of the existing contract gaps changed. In particular, the oracle can't host a third separate public sector sign-in, so the added third evaluator can't score on the oracle. A test can still show the move is withheld, and the existing R-5.27 test already shows it happens with two evaluators.

re-address missing-test/R-1.1 to derive-tests: added persona third-proponent (session-route /auth/createsessionvendor/12, sandbox-idp test-vendor-12) for users.proponentThree, who reads the status of proposals.sprintWithUsThree and proposals.teamWithUsThree on proposal-swu-edit and proposal-twu-edit
re-address missing-test/R-5.27 to derive-tests: added start_editing to evaluation-panel-swu and evaluation-panel-twu and documented that the panel can be changed in individual evaluation, saved as a new version, with users.staffPanelEvaluator as the third evaluator to seat; questions cannot change at that stage, so changing the panel is the version change a test makes
