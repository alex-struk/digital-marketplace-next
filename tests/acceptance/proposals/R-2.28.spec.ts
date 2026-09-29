// criterion: @R-2.28 v2
// provenance: blind, spec@8272c1b989e3bad64c78ae540830a62747dadf42, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";

// Each test opens the page of a proposal whose opportunity has not yet reached the stage a
// score belongs to — a team scenario score on a Sprint With Us opportunity still at its code
// challenge, and a challenge score on a Team With Us opportunity still at question
// consensus — and reads what the page says in place of the score: that the proposal can be
// scored once the opportunity reaches that stage. A score taken at that stage is refused, so
// the proposal holds none afterwards.
//
// Sprint With Us: seed.opportunities.swuPastConsensus stands at the code challenge with both
// proponents screened in and neither scored past the questions. Team With Us:
// seed.opportunities.twuConsensusAllAgreed stands at question consensus. The administrator
// reads and acts, because the administrator may score each stage once it is reached, so who
// is asking cannot account for the refusal.
//
// The criterion also says the page does not offer the score and that the service refuses one
// sent to it directly with its own message. No observation reports whether a score is
// offered, and no surface sends a proposal's stage score to the service directly; see this
// criterion's entry in not-testable.yaml.

const statement =
  "Sprint With Us and Team With Us proposals advance through the evaluation stages one at a time, and an action taken at the wrong stage of the opportunity is refused";

const scoredOnceReached = /can be scored once/i;

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

test(`${statement}: a Sprint With Us proposal's page at the code challenge says it can be scored on the team scenario once the opportunity reaches that stage, and takes no team scenario score`, async ({
  surface,
}) => {
  const where = {
    opportunityId: seed.opportunities.swuPastConsensus.id,
    proposalId: seed.proposals.swuPastConsensusOne.id,
  };
  const view = surface.proposalSwuView;
  await surface.signIn(persona.administrator);

  await view.open(where);
  const said = `${await readOrEmpty(() => view.teamScenarioTab())}\n${await readOrEmpty(() => view.wrongStageError())}`;
  expect(said, "the page does not say the proposal can be scored once the team scenario is reached").toMatch(
    scoredOnceReached,
  );

  await attempt(() => view.scoreTeamScenario({ score: 80 }));

  await view.open(where);
  expect(await readOrEmpty(() => view.scenarioScore()), "a team scenario score was taken at the code challenge").not.toMatch(
    /\d/,
  );
});

test(`${statement}: a Team With Us proposal's page at question consensus says it can be scored on the challenge once the opportunity reaches that stage, and takes no challenge score`, async ({
  surface,
}) => {
  const where = {
    opportunityId: seed.opportunities.twuConsensusAllAgreed.id,
    proposalId: seed.proposals.twuAgreedOne.id,
  };
  const view = surface.proposalTwuView;
  await surface.signIn(persona.administrator);

  await view.open(where);
  const said = `${await readOrEmpty(() => view.challengeTab())}\n${await readOrEmpty(() => view.wrongStageError())}`;
  expect(said, "the page does not say the proposal can be scored once the challenge is reached").toMatch(scoredOnceReached);

  await attempt(() => view.scoreChallenge({ score: 80 }));

  await view.open(where);
  expect(await readOrEmpty(() => view.challengeScore()), "a challenge score was taken at question consensus").not.toMatch(/\d/);
});
