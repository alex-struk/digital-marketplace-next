// criterion: @R-5.1 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const TITLE = "R-5.1 Sprint With Us opportunity being given a panel";

function momentsFromNow(): string {
  return new Date(Date.now() + 10_000).toISOString();
}

// A draft Sprint With Us opportunity, opened at its evaluation panel, is the whole
// setting this criterion needs: the panel is checked when it is saved.
async function draftSwuAtItsPanel(surface: Surface) {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseSprintWithUs();
  await surface.opportunitySwuCreate.saveDraft({ title: TITLE, proposalDeadline: momentsFromNow() });
  await surface.evaluationPanelSwu.open({ title: TITLE });
}

test("an opportunity that uses a panel must name at least two panel members", async ({ surface }) => {
  await draftSwuAtItsPanel(surface);

  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.markMemberAsChair({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.minimumMembersError()).toBeTruthy();
});

test("an opportunity that uses a panel must name each panel member only once", async ({ surface }) => {
  await draftSwuAtItsPanel(surface);

  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.choosePanelChair({ member: seed.users.staffPanelChair });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.duplicateMemberError()).toBeTruthy();
});

test("an opportunity that uses a panel must name panel members who are each a public sector employee", async ({ surface }) => {
  await draftSwuAtItsPanel(surface);

  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.vendorOne });
  await surface.evaluationPanelSwu.choosePanelChair({ member: seed.users.staffPanelChair });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.nonPublicSectorMemberError()).toBeTruthy();
});

test("a rejected panel leaves the opportunity with the panel it had", async ({ surface }) => {
  await draftSwuAtItsPanel(surface);

  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.administratorOne });
  await surface.evaluationPanelSwu.choosePanelChair({ member: seed.users.staffPanelChair });
  await surface.evaluationPanelSwu.saveEvaluationPanel();
  const accepted = await surface.evaluationPanelSwu.panelMemberRow();

  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.vendorOne });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.nonPublicSectorMemberError()).toBeTruthy();
  await surface.evaluationPanelSwu.open({ title: TITLE });
  expect(await surface.evaluationPanelSwu.panelMemberRow()).toBe(accepted);
});
