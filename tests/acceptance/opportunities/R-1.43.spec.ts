// criterion: @R-1.43 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is an opportunity that has reached the consensus stage or beyond, with a panel
// already named. The seed carries one at the questions consensus stage in each program: a
// Sprint With Us opportunity with one consensus outstanding, and a Team With Us opportunity
// with five proponents. Nothing in either moves, so reading their panels changes nothing else.
//
// The opportunity's author asks to change the panel by adding a member who is not on it and
// saving. The request is read as refused when the panel, opened afresh, is as it was before. A
// change the panel screen will not let be made at all is refused too, since the actions fail
// rather than wait.

const statement =
  "The evaluation panel of a Sprint With Us or Team With Us opportunity may be changed only while the opportunity is a draft, under review, published, or at the first questions stage.";

const settle = { timeout: 15000 };
const quietPeriod = 5000;
const newcomer = seed.users.staffPanelEvaluator;

type Panel = Surface["evaluationPanelSwu"];

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function expectPanelLocked(panel: Panel, opportunityId: string): Promise<void> {
  await panel.open({ opportunityId });
  await expect.poll(() => readOrEmpty(() => panel.panelMemberRow()), settle).toBeTruthy();
  const before = await panel.panelMemberRow();

  try {
    await panel.addPanelMember({ member: newcomer });
    await panel.saveEvaluationPanel();
  } catch {
    // A change the screen will not offer is refused; the panel is read below.
  }

  await new Promise((resolve) => setTimeout(resolve, quietPeriod));
  await panel.open({ opportunityId });
  expect(await readOrEmpty(() => panel.panelMemberRow())).toBe(before);
}

test(`${statement} (Sprint With Us at the consensus stage)`, async ({ surface }) => {
  const opportunityId = seed.opportunities.swuConsensusOneOutstanding.id;
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuView.open({ opportunityId });
  expect(await readOrEmpty(() => surface.opportunitySwuView.status())).toBeTruthy();

  await expectPanelLocked(surface.evaluationPanelSwu, opportunityId);
});

test(`${statement} (Team With Us at the consensus stage)`, async ({ surface }) => {
  const opportunityId = seed.opportunities.twuConsensusFiveProponents.id;
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityTwuView.open({ opportunityId });
  expect(await readOrEmpty(() => surface.opportunityTwuView.status())).toBeTruthy();

  await expectPanelLocked(surface.evaluationPanelTwu, opportunityId);
});
