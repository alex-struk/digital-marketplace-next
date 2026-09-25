// criterion: @R-1.27 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The seed carries an opportunity already awarded to Northern Pines in Code With Us and in
// Sprint With Us. Each is looked at twice:
//
//   - by a visitor who is not signed in, who may not see any proposal's score: the successful
//     proponent's name is shown, and neither their contact details nor their score is;
//   - by an administrator, who may see every proposal's score: the contact details and the
//     score are shown.
//
// The view is first read as awarded, so that nothing withheld can be put down to the award not
// having been made.

const statement =
  "An awarded opportunity shows its successful proponent's name to everyone, and shows the proponent's contact details and score only to those permitted to see the proposal's score.";

const settle = { timeout: 15000 };
const winner = seed.organizations.qualified.legal_name;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

type View = Surface["opportunityCwuView"] | Surface["opportunitySwuView"];

const programs: Array<{ name: string; opportunityId: string; view: (surface: Surface) => View }> = [
  { name: "Code With Us", opportunityId: seed.opportunities.cwuAwarded.id, view: (surface) => surface.opportunityCwuView },
  { name: "Sprint With Us", opportunityId: seed.opportunities.swuAwarded.id, view: (surface) => surface.opportunitySwuView },
];

async function openAwarded(view: View, opportunityId: string): Promise<void> {
  await view.open({ opportunityId });
  await expect.poll(async () => (await readOrEmpty(() => view.status())).toLowerCase(), settle).toMatch(/awarded/);
}

for (const { name, opportunityId, view: viewOf } of programs) {
  test(`${statement} (${name}: a visitor who may not see proposal scores)`, async ({ surface }) => {
    const view = viewOf(surface);
    await openAwarded(view, opportunityId);

    expect(await view.successfulProponent()).toContain(winner);
    expect(await readOrEmpty(() => view.successfulProponentContactDetails())).toBeFalsy();
    expect(await readOrEmpty(() => view.successfulProponentScore())).toBeFalsy();
  });

  test(`${statement} (${name}: a reader permitted to see proposal scores)`, async ({ surface }) => {
    await surface.signIn(persona.administrator);
    const view = viewOf(surface);
    await openAwarded(view, opportunityId);

    expect(await view.successfulProponent()).toContain(winner);
    await expect.poll(() => readOrEmpty(() => view.successfulProponentContactDetails()), settle).toBeTruthy();
    await expect.poll(() => readOrEmpty(() => view.successfulProponentScore()), settle).toBeTruthy();
  });
}
