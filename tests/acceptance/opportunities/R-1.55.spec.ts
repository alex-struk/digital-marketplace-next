// criterion: @R-1.55 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each test starts from a draft of its own, made by the public sector employee persona, whose
// account the seed names as users.staffOne. A new draft already names its creator on the panel
// as chair, so every panel below is built from that starting point into exactly the faulty
// panel the criterion names, and differs from it, so a panel that was wrongly saved would read
// differently afterwards. The Team With Us draft is given a resource before it is saved, and
// its identifier is required, so the panel is only ever put forward on a draft the service
// accepted.
//
// "Rejected" is read by opening the panel afresh before and after the attempt and requiring
// the two readings to be the same. A panel that cannot be assembled — a vendor never offered
// as a choice, the last member the form will not remove — or a save that is not offered counts
// as refused, because the actions fail rather than wait. Where the panel is assembled and put
// forward, the observation that names its fault is waited for. The same person named twice
// must always have its reason named.
//
// More than one chair has no observation naming its reason. That test rests on the panel not
// being saved with two chairs: the chair reading afterwards either is unchanged or no longer
// names the original chair beside another.

const statement =
  "A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named.";

const settle = { timeout: 15000 };
const creator = seed.users.staffOne;

type Panel = Surface["evaluationPanelSwu"];

interface Program {
  name: string;
  draft(surface: Surface, title: string): Promise<string>;
  panel(surface: Surface): Panel;
}

const programs: Program[] = [
  {
    name: "Sprint With Us",
    async draft(surface, title) {
      await surface.opportunitySwuCreate.open();
      await surface.opportunitySwuCreate.saveDraft({ title });
      return surface.opportunitySwuEdit.opportunityIdentifier();
    },
    panel: (surface) => surface.evaluationPanelSwu,
  },
  {
    name: "Team With Us",
    async draft(surface, title) {
      await surface.opportunityTwuCreate.open();
      await surface.opportunityTwuCreate.addResource({ serviceArea: "Full Stack Developer", targetAllocation: 100 });
      await surface.opportunityTwuCreate.saveDraft({ title });
      return surface.opportunityTwuEdit.opportunityIdentifier();
    },
    panel: (surface) => surface.evaluationPanelTwu,
  },
];

async function draftPanel(surface: Surface, program: Program, title: string) {
  await surface.signIn(persona.publicSectorStaff);
  const opportunityId = await program.draft(surface, title);
  expect(opportunityId).toBeTruthy();
  const panel = program.panel(surface);
  await panel.open({ opportunityId });
  const before = await panel.panelMemberRow();
  expect(before).toBeTruthy();
  return { opportunityId, panel, before };
}

// Runs the steps that make the panel faulty and save it; true when one of them was refused.
async function refusedWhileAssembling(steps: () => Promise<void>): Promise<boolean> {
  try {
    await steps();
    return false;
  } catch {
    return true;
  }
}

async function namedReason(read: () => Promise<string>): Promise<boolean> {
  try {
    return Boolean(await read());
  } catch {
    return false;
  }
}

async function expectPanelUnchanged(panel: Panel, opportunityId: string, before: string): Promise<void> {
  await panel.open({ opportunityId });
  expect(await panel.panelMemberRow()).toBe(before);
}

for (const program of programs) {
  test(`${statement} (${program.name}: fewer than two members)`, async ({ surface }) => {
    const { opportunityId, panel, before } = await draftPanel(surface, program, `R-1.55 ${program.name} panel of one`);

    const refused = await refusedWhileAssembling(async () => {
      await panel.addPanelMember({ member: seed.users.staffPanelEvaluator });
      await panel.removePanelMember({ member: creator });
      await panel.markMemberAsChair({ member: seed.users.staffPanelEvaluator });
      await panel.saveEvaluationPanel();
    });

    await expect.poll(async () => refused || (await namedReason(() => panel.minimumMembersError())), settle).toBe(true);
    await expectPanelUnchanged(panel, opportunityId, before);
  });

  test(`${statement} (${program.name}: the same person twice)`, async ({ surface }) => {
    const { opportunityId, panel, before } = await draftPanel(surface, program, `R-1.55 ${program.name} panel naming one person twice`);

    await panel.addPanelMember({ member: seed.users.staffPanelEvaluator });
    await panel.addPanelMember({ member: seed.users.staffPanelEvaluator });
    await refusedWhileAssembling(() => panel.saveEvaluationPanel());

    await expect.poll(() => panel.duplicateMemberError(), settle).toBeTruthy();
    await expectPanelUnchanged(panel, opportunityId, before);
  });

  test(`${statement} (${program.name}: no chair)`, async ({ surface }) => {
    const { opportunityId, panel, before } = await draftPanel(surface, program, `R-1.55 ${program.name} panel with no chair`);

    await panel.addPanelMember({ member: seed.users.staffPanelEvaluator });
    await panel.addPanelMember({ member: seed.users.staffPanelChair });
    const refused = await refusedWhileAssembling(async () => {
      await panel.removePanelMember({ member: creator });
      await panel.saveEvaluationPanel();
    });

    await expect.poll(async () => refused || (await namedReason(() => panel.missingChairError())), settle).toBe(true);
    await expectPanelUnchanged(panel, opportunityId, before);
  });

  test(`${statement} (${program.name}: more than one chair)`, async ({ surface }) => {
    const { opportunityId, panel } = await draftPanel(surface, program, `R-1.55 ${program.name} panel with two chairs`);
    const chairBefore = await panel.chairField();
    expect(chairBefore).toBeTruthy();

    await panel.addPanelMember({ member: seed.users.staffPanelEvaluator });
    await refusedWhileAssembling(async () => {
      await panel.markMemberAsChair({ member: seed.users.staffPanelEvaluator });
      await panel.saveEvaluationPanel();
    });

    await panel.open({ opportunityId });
    const chairAfter = await panel.chairField();
    expect(chairAfter === chairBefore || !chairAfter.includes(chairBefore)).toBe(true);
  });

  test(`${statement} (${program.name}: someone who is not a public sector employee)`, async ({ surface }) => {
    const { opportunityId, panel, before } = await draftPanel(surface, program, `R-1.55 ${program.name} panel naming a vendor`);

    const refused = await refusedWhileAssembling(async () => {
      await panel.addPanelMember({ member: seed.users.vendorOne });
      await panel.saveEvaluationPanel();
    });

    await expect
      .poll(async () => refused || (await namedReason(() => panel.nonPublicSectorMemberError())), settle)
      .toBe(true);
    await expectPanelUnchanged(panel, opportunityId, before);
  });
}
