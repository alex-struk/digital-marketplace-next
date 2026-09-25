// criterion: @R-1.41 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is a Sprint With Us opportunity at the questions consensus stage, which the seed
// carries in the two forms the criterion turns on: one whose consensus for the third proponent
// has not been begun, and one where every consensus is submitted but no proponent has cleared
// the fourth question's minimum score. The seed carries no Team With Us opportunity in either
// form, so the refusal is taken in Sprint With Us.
//
// The opportunity's author — the public sector employee the seed names as its creator — asks to
// move it on from the consensus screen, confirming if asked. The request is read as refused
// when the opportunity still reads the state it read before, after a pause long enough for a
// slow move to land, and the reason the criterion's then names is waited for on that screen.

const statement =
  "Advancing a Sprint With Us or Team With Us opportunity out of the consensus stage is refused unless every consensus evaluation has been submitted and at least one proponent has met the minimum score on every question that sets one.";

const settle = { timeout: 15000 };
const quietPeriod = 5000;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function status(surface: Surface, opportunityId: string): Promise<string> {
  await surface.opportunitySwuView.open({ opportunityId });
  return (await readOrEmpty(() => surface.opportunitySwuView.status())).toLowerCase();
}

async function askToMoveOn(surface: Surface, opportunityId: string): Promise<void> {
  await surface.evaluationConsensusListSwu.open({ opportunityId });
  try {
    await surface.evaluationConsensusListSwu.finalizeConsensusScores();
    await surface.evaluationConsensusListSwu.confirmFinalizeConsensus();
  } catch {
    // A move the screen will not offer, or will not confirm, is refused; the state is read below.
  }
}

test(`${statement} (Sprint With Us: a consensus evaluation still unsubmitted)`, async ({ surface }) => {
  const opportunityId = seed.opportunities.swuConsensusOneOutstanding.id;

  await surface.signIn(persona.publicSectorStaff);
  const before = await status(surface, opportunityId);
  expect(before).toBeTruthy();

  await askToMoveOn(surface, opportunityId);
  await expect
    .poll(() => readOrEmpty(() => surface.evaluationConsensusListSwu.notAllConsensusesSubmittedError()), settle)
    .toBeTruthy();

  await new Promise((resolve) => setTimeout(resolve, quietPeriod));
  expect(await status(surface, opportunityId)).toBe(before);
});

test(`${statement} (Sprint With Us: no proponent has met every minimum score)`, async ({ surface }) => {
  const opportunityId = seed.opportunities.swuConsensusNobodyScreenable.id;

  await surface.signIn(persona.publicSectorStaff);
  const before = await status(surface, opportunityId);
  expect(before).toBeTruthy();

  await askToMoveOn(surface, opportunityId);
  await expect
    .poll(() => readOrEmpty(() => surface.evaluationConsensusListSwu.noScreenableProponentError()), settle)
    .toBeTruthy();

  await new Promise((resolve) => setTimeout(resolve, quietPeriod));
  expect(await status(surface, opportunityId)).toBe(before);
});
