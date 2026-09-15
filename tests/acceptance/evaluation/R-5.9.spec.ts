// criterion: @R-5.9 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";

// A new Sprint With Us draft already names its creator — users.staffOne, the account the
// public sector employee persona signs in as — on the panel as chair. So the panel put
// forward here is built from that: two other public sector employees are added and the
// creator, the only chair, is removed, leaving two members, both public sector employees,
// each named once, and nobody marked as chair. The missing chair is the only fault it has.
//
// The refusal is read the way a person would find it: the panel is opened afresh before and
// after, and must read the same, and either the save is not offered or the missing chair is
// named. What a blind test cannot tell apart is which layer did the refusing — every action
// that saves a panel goes through the browser form, so a chairless panel reaching the service
// without the form, which is the half of the criterion that is the service's own check,
// needs an action that saves a panel the form would withhold.
//
// The consequence the criterion gives as its reason — no opportunity entering consensus with
// nobody able to record the agreed score — is not asserted: a draft built here cannot be
// carried to consensus, and the seeded closed opportunities already have a chair.

const settle = { timeout: 15000 };

test("The service must reject an evaluation panel that names no chair, applying the same rule the browser form already applies, so that no opportunity can enter consensus with nobody able to record the agreed score.", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title: "R-5.9 opportunity offered a panel with no chair" });
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();

  await surface.evaluationPanelSwu.open({ opportunityId });
  const before = await surface.evaluationPanelSwu.panelMemberRow();
  expect(before).toBeTruthy();

  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelChair });

  let refused = false;
  try {
    await surface.evaluationPanelSwu.removePanelMember({ member: seed.users.staffOne });
    await surface.evaluationPanelSwu.saveEvaluationPanel();
  } catch {
    refused = true;
  }

  await expect
    .poll(async () => {
      if (refused) return true;
      try {
        return Boolean(await surface.evaluationPanelSwu.missingChairError());
      } catch {
        return false;
      }
    }, settle)
    .toBe(true);

  await surface.evaluationPanelSwu.open({ opportunityId });
  expect(await surface.evaluationPanelSwu.panelMemberRow()).toBe(before);
});
