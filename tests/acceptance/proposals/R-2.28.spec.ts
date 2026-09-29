// criterion: @R-2.28 v1
// provenance: blind, spec@ccc1cba3290f5ea17351e4f2ca49bd80fefc2ef6, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";

// Each test takes an action that belongs to a stage the opportunity has not reached yet,
// against a proposal that is in contention at the stage the opportunity is at: a team
// scenario score on a Sprint With Us opportunity still at its code challenge, and a challenge
// score on a Team With Us opportunity still at its question consensus. An opportunity that
// advances one stage at a time cannot take either.
//
// Sprint With Us: seed.opportunities.swuPastConsensus stands at the code challenge with both
// proponents screened in and neither scored on anything past the questions. Team With Us:
// seed.opportunities.twuConsensusAllAgreed stands at question consensus. The administrator
// acts, because the administrator may take each of these actions at the stage it belongs to,
// so who is asking cannot account for a refusal.
//
// What is asserted is the refusal of the action itself: the score is not recorded, and where
// the screen reports why, it reports the wrong stage in the criterion's words. A screen that
// does not offer the action at this stage is not a failure: an action that cannot be taken
// has been refused, and the proposal is read afterwards all the same.

const statement =
  "Sprint With Us and Team With Us proposals advance through the evaluation stages one at a time, and an action taken at the wrong stage of the opportunity is refused.";

const wrongStage = "The opportunity is not in the correct stage of evaluation to perform that action.";

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

async function expectWrongStageIfReported(report: string): Promise<void> {
  if (report) expect(report).toContain(wrongStage);
}

test(`${statement} (a team scenario score entered while a Sprint With Us opportunity is at its code challenge is refused)`, async ({
  surface,
}) => {
  const where = {
    opportunityId: seed.opportunities.swuPastConsensus.id,
    proposalId: seed.proposals.swuPastConsensusOne.id,
  };
  const view = surface.proposalSwuView;
  await surface.signIn(persona.administrator);

  await view.open(where);
  expect(await readOrEmpty(() => view.scenarioScore()), "the proposal already holds a team scenario score").not.toMatch(/\d/);

  await attempt(() => view.scoreTeamScenario({ score: 80 }));
  await expectWrongStageIfReported(await readOrEmpty(() => view.wrongStageError()));

  await view.open(where);
  expect(await readOrEmpty(() => view.scenarioScore()), "a team scenario score was recorded at the code challenge").not.toMatch(
    /\d/,
  );
});

test(`${statement} (a challenge score entered while a Team With Us opportunity is at question consensus is refused)`, async ({
  surface,
}) => {
  const where = {
    opportunityId: seed.opportunities.twuConsensusAllAgreed.id,
    proposalId: seed.proposals.twuAgreedOne.id,
  };
  const view = surface.proposalTwuView;
  await surface.signIn(persona.administrator);

  await view.open(where);
  expect(await readOrEmpty(() => view.challengeScore()), "the proposal already holds a challenge score").not.toMatch(/\d/);

  await attempt(() => view.scoreChallenge({ score: 80 }));
  await expectWrongStageIfReported(await readOrEmpty(() => view.wrongStageError()));

  await view.open(where);
  expect(await readOrEmpty(() => view.challengeScore()), "a challenge score was recorded at question consensus").not.toMatch(/\d/);
});
