// criterion: @R-1.50 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is a Sprint With Us opportunity at the questions consensus stage, which the seed
// carries in the two forms the refusal turns on: one with a consensus still unsubmitted, and one
// where every consensus is submitted but no proponent has cleared the fourth question's minimum
// score.
//
// The surface offers moving on from consensus in two places — the finalise action on the
// opportunity's management screen and the finalise action on its consensus screen — and the
// opportunity's author takes each in turn, confirming where asked. Whichever way is taken, the
// move must be refused: the opportunity still reads the state it read before, after a pause long
// enough for a slow move to land.
//
// That no second way out exists at all is the absence of an action, which no observation
// reports, so it is not asserted here; what is asserted is that no way out the surface offers
// advances an opportunity the checks would stop.

const statement =
  "There is exactly one path out of a questions consensus stage, and it refuses to advance unless every consensus evaluation has been submitted and at least one proponent has met the minimum score on every question that sets one.";

const quietPeriod = 5000;

async function status(surface: Surface, opportunityId: string): Promise<string> {
  await surface.opportunitySwuView.open({ opportunityId });
  try {
    return (await surface.opportunitySwuView.status()).toLowerCase();
  } catch {
    return "";
  }
}

async function attempt(steps: () => Promise<void>): Promise<void> {
  try {
    await steps();
  } catch {
    // A move the screen will not offer, or will not confirm, is refused; the state is read after.
  }
}

async function expectNoWayOutAdvances(surface: Surface, opportunityId: string): Promise<void> {
  await surface.signIn(persona.publicSectorStaff);
  const before = await status(surface, opportunityId);
  expect(before).toBeTruthy();

  await surface.opportunitySwuEdit.open({ opportunityId });
  await attempt(() => surface.opportunitySwuEdit.finalizeQuestionConsensuses());
  await new Promise((resolve) => setTimeout(resolve, quietPeriod));
  expect(await status(surface, opportunityId)).toBe(before);

  await surface.evaluationConsensusListSwu.open({ opportunityId });
  await attempt(async () => {
    await surface.evaluationConsensusListSwu.finalizeConsensusScores();
    await surface.evaluationConsensusListSwu.confirmFinalizeConsensus();
  });
  await new Promise((resolve) => setTimeout(resolve, quietPeriod));
  expect(await status(surface, opportunityId)).toBe(before);
}

test(`${statement} (a consensus evaluation still unsubmitted)`, async ({ surface }) => {
  await expectNoWayOutAdvances(surface, seed.opportunities.swuConsensusOneOutstanding.id);
});

test(`${statement} (no proponent has met every minimum score)`, async ({ surface }) => {
  await expectNoWayOutAdvances(surface, seed.opportunities.swuConsensusNobodyScreenable.id);
});
