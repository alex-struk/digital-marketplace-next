// criterion: @R-1.42 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is a Sprint With Us opportunity at the code challenge stage with a proponent still
// unscored and not disqualified. The seed carries exactly that: the first proponent scored on
// the code challenge, the second screened in and neither scored nor disqualified.
//
// The opportunity's author asks to move it to the team scenario. The request is read as refused
// when the opportunity still reads the state it read before, after a pause long enough for a
// slow move to land. The management screen names no observation for the message the criterion's
// then describes, so only the refusal is asserted.

const statement =
  "Advancing a Sprint With Us opportunity to the team scenario stage is refused unless every proponent in the code challenge has been scored or disqualified and at least one remains screened in.";

const quietPeriod = 5000;
const opportunityId = seed.opportunities.swuCodeChallengePartlyScored.id;

async function status(surface: Surface): Promise<string> {
  await surface.opportunitySwuView.open({ opportunityId });
  try {
    return (await surface.opportunitySwuView.status()).toLowerCase();
  } catch {
    return "";
  }
}

test(`${statement} (a proponent in the code challenge neither scored nor disqualified)`, async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  const before = await status(surface);
  expect(before).toBeTruthy();
  expect(before).not.toMatch(/scenario/);

  await surface.opportunitySwuEdit.open({ opportunityId });
  try {
    await surface.opportunitySwuEdit.startTeamScenario();
  } catch {
    // A move the screen will not offer is refused; the state is read below.
  }

  await new Promise((resolve) => setTimeout(resolve, quietPeriod));
  const after = await status(surface);
  expect(after).toBe(before);
  expect(after).not.toMatch(/scenario/);
});
