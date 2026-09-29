// criterion: @R-5.13 v1
// provenance: blind, spec@ccc1cba3290f5ea17351e4f2ca49bd80fefc2ef6, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is the seeded Sprint With Us opportunity at consensus with every individual
// evaluation submitted, the chair's consensus submitted for the first two proponents, and
// nothing begun for the third, which is still under review of the questions: one proponent
// lacks a submitted consensus.
//
// An administrator attempts to finalise the consensus scores from the consensus list,
// confirming if asked. A screen that will not offer or confirm the finalise has refused it as
// surely as a service that turns it down, so neither is treated as a failure of the test. The
// refusal is read on the opportunity itself: after a pause long enough for a slow finalise to
// land, it still reads the state it read before the attempt, which is consensus.

const statement =
  "Finalising the consensus scores must be refused unless every proponent still under review of the questions has a submitted consensus, so that no proponent is left neither screened in nor screened out.";

const quietPeriod = 5000;
const opportunityId = seed.opportunities.swuConsensusOneOutstanding.id;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function opportunityStatus(surface: Surface): Promise<string> {
  await surface.opportunitySwuView.open({ opportunityId });
  return (await readOrEmpty(() => surface.opportunitySwuView.status())).trim();
}

test(statement, async ({ surface }) => {
  await surface.signIn(persona.administrator);

  const before = await opportunityStatus(surface);
  expect(before).toBeTruthy();

  await surface.evaluationConsensusListSwu.open({ opportunityId });
  try {
    await surface.evaluationConsensusListSwu.finalizeConsensusScores();
    await surface.evaluationConsensusListSwu.confirmFinalizeConsensus();
  } catch {
    // A finalise the screen will not offer or confirm is refused; what stands is read below.
  }

  await new Promise((resolve) => setTimeout(resolve, quietPeriod));
  expect(await opportunityStatus(surface), "the consensus scores were finalised").toBe(before);
});
