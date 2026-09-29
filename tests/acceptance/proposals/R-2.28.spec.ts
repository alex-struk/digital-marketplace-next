// criterion: @R-2.28 v2
// provenance: blind, spec@8272c1b989e3bad64c78ae540830a62747dadf42, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";

// Each program has one proposal that has itself been carried into a stage its opportunity has
// not yet reached, so the only thing standing between it and a score for that stage is the
// opportunity's stage:
//
// - Sprint With Us: seed.proposals.swuScreenedIntoScenarioEarly is in the team scenario while
//   seed.opportunities.swuCodeChallengeWithScenarioScreenedIn still stands at the code
//   challenge.
// - Team With Us: seed.proposals.twuScreenedIntoChallengeEarly is in the challenge while
//   seed.opportunities.twuConsensusWithChallengeScreenedIn still stands at question consensus.
//
// The administrator reads and acts throughout, because the administrator may score every stage
// once it is reached, so who is asking cannot account for the refusal. Each page test also
// reads a control proposal whose opportunity has reached its stage, so an empty list of offered
// score actions is known to mean "not offered here" rather than "never reported".

const statement =
  "Sprint With Us and Team With Us proposals advance through the evaluation stages one at a time, and an action taken at the wrong stage of the opportunity is refused";

const scoredOnceReached = /can be scored once/i;
const wrongStage = "The opportunity is not in the correct stage of evaluation to perform that action.";
const settle = { timeout: 30000 };

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function attempt(action: () => Promise<void>): Promise<void> {
  await action().catch(() => undefined);
}

test(`${statement}: a Sprint With Us proposal's page does not offer a team scenario score while the opportunity is at the code challenge, and says instead that the proposal can be scored once the opportunity reaches that stage`, async ({
  surface,
}) => {
  const view = surface.proposalSwuView;
  const opportunityId = seed.opportunities.swuCodeChallengeWithScenarioScreenedIn.id;
  await surface.signIn(persona.administrator);

  await view.open({ opportunityId, proposalId: seed.proposals.swuScreenedIntoCodeChallenge.id });
  expect(
    await readOrEmpty(() => view.offeredScoreActions()),
    "the control proposal, at the stage its opportunity has reached, is offered that stage's score",
  ).toContain("score_code_challenge");

  await view.open({ opportunityId, proposalId: seed.proposals.swuScreenedIntoScenarioEarly.id });
  expect(
    await readOrEmpty(() => view.offeredScoreActions()),
    "a team scenario score is offered before the opportunity has reached the team scenario",
  ).not.toContain("score_team_scenario");
  const said = `${await readOrEmpty(() => view.teamScenarioTab())}\n${await readOrEmpty(() => view.wrongStageError())}`;
  expect(said, "the page does not say the proposal can be scored once the team scenario is reached").toMatch(
    scoredOnceReached,
  );
});

test(`${statement}: a Team With Us proposal's page does not offer a challenge score while the opportunity is at question consensus, and says instead that the proposal can be scored once the opportunity reaches that stage`, async ({
  surface,
}) => {
  const view = surface.proposalTwuView;
  await surface.signIn(persona.administrator);

  await view.open({
    opportunityId: seed.opportunities.twuChallengeLastToScore.id,
    proposalId: seed.proposals.twuChallengeLast.id,
  });
  expect(
    await readOrEmpty(() => view.offeredScoreActions()),
    "the control proposal, on an opportunity at the challenge, is offered the challenge score",
  ).toContain("score_challenge");

  await view.open({
    opportunityId: seed.opportunities.twuConsensusWithChallengeScreenedIn.id,
    proposalId: seed.proposals.twuScreenedIntoChallengeEarly.id,
  });
  expect(
    await readOrEmpty(() => view.offeredScoreActions()),
    "a challenge score is offered before the opportunity has reached the challenge",
  ).not.toContain("score_challenge");
  const said = `${await readOrEmpty(() => view.challengeTab())}\n${await readOrEmpty(() => view.wrongStageError())}`;
  expect(said, "the page does not say the proposal can be scored once the challenge is reached").toMatch(scoredOnceReached);
});

test(`${statement}: the service refuses a team scenario score sent to it directly for a Sprint With Us opportunity still at its code challenge with "${wrongStage}"`, async ({
  surface,
}) => {
  const request = surface.proposalEvaluationRequest;
  await surface.signIn(persona.administrator);

  await request.open({ program: "sprint-with-us", proposalId: seed.proposals.swuScreenedIntoScenarioEarly.id });
  await attempt(() => request.scoreTeamScenarioByRequest({ score: 80 }));
  await expect
    .poll(
      async () => (await readOrEmpty(() => request.requestAccepted())) || (await readOrEmpty(() => request.refusalStatus())),
      { ...settle, message: "the service answered the score" },
    )
    .toBeTruthy();

  expect(await readOrEmpty(() => request.requestAccepted()), "a team scenario score was taken at the code challenge").toBeFalsy();
  expect(await readOrEmpty(() => request.refusalMessages())).toContain(wrongStage);
});

test(`${statement}: the service refuses a challenge score sent to it directly for a Team With Us opportunity still at question consensus with "${wrongStage}"`, async ({
  surface,
}) => {
  const request = surface.proposalEvaluationRequest;
  await surface.signIn(persona.administrator);

  await request.open({ program: "team-with-us", proposalId: seed.proposals.twuScreenedIntoChallengeEarly.id });
  await attempt(() => request.scoreChallengeByRequest({ score: 80 }));
  await expect
    .poll(
      async () => (await readOrEmpty(() => request.requestAccepted())) || (await readOrEmpty(() => request.refusalStatus())),
      { ...settle, message: "the service answered the score" },
    )
    .toBeTruthy();

  expect(await readOrEmpty(() => request.requestAccepted()), "a challenge score was taken at question consensus").toBeFalsy();
  expect(await readOrEmpty(() => request.refusalMessages())).toContain(wrongStage);
});
