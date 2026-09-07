// criterion: @R-5.9 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const SWU_TITLE = "R-5.9 Sprint With Us opportunity given a panel with no chair";
const TWU_TITLE = "R-5.9 Team With Us opportunity given a panel with no chair";

function momentsFromNow(): string {
  return new Date(Date.now() + 10_000).toISOString();
}

async function draftSwuAtItsPanel(surface: Surface) {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseSprintWithUs();
  await surface.opportunitySwuCreate.saveDraft({ title: SWU_TITLE, proposalDeadline: momentsFromNow() });
  await surface.evaluationPanelSwu.open({ title: SWU_TITLE });
}

async function draftTwuAtItsPanel(surface: Surface) {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseTeamWithUs();
  await surface.opportunityTwuCreate.saveDraft({ title: TWU_TITLE, proposalDeadline: momentsFromNow() });
  await surface.evaluationPanelTwu.open({ title: TWU_TITLE });
}

test("the service must reject an evaluation panel that names no chair", async ({ surface }) => {
  await draftSwuAtItsPanel(surface);

  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.administratorOne });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.missingChairError()).toBeTruthy();
  expect(await surface.evaluationPanelSwu.chairField()).toBeFalsy();
});

test("the service applies the same rule the browser form already applies, so that no opportunity can enter consensus with nobody able to record the agreed score", async ({ surface }) => {
  await draftTwuAtItsPanel(surface);

  await surface.evaluationPanelTwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelTwu.addPanelMember({ member: seed.users.administratorOne });
  await surface.evaluationPanelTwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelTwu.missingChairError()).toBeTruthy();
  expect(await surface.evaluationPanelTwu.chairField()).toBeFalsy();
});
