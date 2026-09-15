// criterion: @R-5.1 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each test starts from a Sprint With Us draft of its own, made by the public sector
// employee persona, whose account the seed names as users.staffOne. A new draft already
// names its creator on the panel as chair, so every panel below is built from that starting
// point into exactly the faulty panel the given describes, and differs from it, so a panel
// that was wrongly saved would read differently afterwards.
//
// "The opportunity keeps the panel it had" is read by opening the panel afresh before and
// after the attempt and requiring the two readings of panel_member_row to be the same. A
// panel that cannot be assembled — a vendor never offered as a choice, a second chair the
// form will not take — or a save that is not offered, counts as refused, because the actions
// are bounded and fail rather than wait. The one fault whose rule must still be named is the
// same person named twice; the one fault with no observation naming its rule is two chairs,
// so that test rests on the panel being unchanged alone.
//
// Only Sprint With Us is exercised: the two panel surfaces carry the same actions and
// observations, and the criterion's note says the minimum of two is the same in both.

const statement =
  "An opportunity that uses a panel must name at least two panel members, each a public sector employee, each named only once, and at most one of them marked as chair.";

const settle = { timeout: 15000 };
const creator = seed.users.staffOne;

async function draftPanel(surface: Surface, title: string): Promise<{ opportunityId: string; before: string }> {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title });
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();
  await surface.evaluationPanelSwu.open({ opportunityId });
  const before = await surface.evaluationPanelSwu.panelMemberRow();
  expect(before).toBeTruthy();
  return { opportunityId, before };
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

async function namedRule(read: () => Promise<string>): Promise<boolean> {
  try {
    return Boolean(await read());
  } catch {
    return false;
  }
}

async function expectPanelUnchanged(surface: Surface, opportunityId: string, before: string): Promise<void> {
  await surface.evaluationPanelSwu.open({ opportunityId });
  expect(await surface.evaluationPanelSwu.panelMemberRow()).toBe(before);
}

test(`${statement} (a panel of one person is rejected)`, async ({ surface }) => {
  const { opportunityId, before } = await draftPanel(surface, "R-5.1 opportunity offered a panel of one person");

  const refused = await refusedWhileAssembling(async () => {
    await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
    await surface.evaluationPanelSwu.removePanelMember({ member: creator });
    await surface.evaluationPanelSwu.markMemberAsChair({ member: seed.users.staffPanelEvaluator });
    await surface.evaluationPanelSwu.saveEvaluationPanel();
  });

  await expect
    .poll(async () => refused || (await namedRule(() => surface.evaluationPanelSwu.minimumMembersError())), settle)
    .toBe(true);
  await expectPanelUnchanged(surface, opportunityId, before);
});

test(`${statement} (a panel naming the same person twice is rejected with the rule named)`, async ({
  surface,
}) => {
  const { opportunityId, before } = await draftPanel(surface, "R-5.1 opportunity offered one person twice");

  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await refusedWhileAssembling(() => surface.evaluationPanelSwu.saveEvaluationPanel());

  await expect.poll(() => surface.evaluationPanelSwu.duplicateMemberError(), settle).toBeTruthy();
  await expectPanelUnchanged(surface, opportunityId, before);
});

test(`${statement} (a panel naming two chairs is rejected)`, async ({ surface }) => {
  const { opportunityId, before } = await draftPanel(surface, "R-5.1 opportunity offered two chairs");

  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await refusedWhileAssembling(async () => {
    await surface.evaluationPanelSwu.markMemberAsChair({ member: seed.users.staffPanelEvaluator });
    await surface.evaluationPanelSwu.saveEvaluationPanel();
  });

  await expectPanelUnchanged(surface, opportunityId, before);
});

test(`${statement} (a panel naming a vendor is rejected)`, async ({ surface }) => {
  const { opportunityId, before } = await draftPanel(surface, "R-5.1 opportunity offered a vendor on its panel");

  const refused = await refusedWhileAssembling(async () => {
    await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.vendorOne });
    await surface.evaluationPanelSwu.saveEvaluationPanel();
  });

  await expect
    .poll(async () => refused || (await namedRule(() => surface.evaluationPanelSwu.nonPublicSectorMemberError())), settle)
    .toBe(true);
  await expectPanelUnchanged(surface, opportunityId, before);
});
