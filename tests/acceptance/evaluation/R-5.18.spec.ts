// criterion: @R-5.18 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const TITLE = "R-5.18 Sprint With Us opportunity with an evaluation panel";
const QUESTION = "Describe how your team would run the first sprint.";

function momentsFromNow(): string {
  return new Date(Date.now() + 10_000).toISOString();
}

async function aPublishedOpportunityWithAPanel(surface: Surface) {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseSprintWithUs();
  await surface.opportunitySwuCreate.addPhase({ phase: "implementation" });
  await surface.opportunitySwuCreate.addTeamQuestion({ question: QUESTION, maximumScore: 5, minimumScore: 1 });
  await surface.opportunitySwuCreate.setEvaluationPanel({
    evaluators: [seed.users.staffPanelEvaluator],
    chair: seed.users.staffPanelChair,
  });
  await surface.opportunitySwuCreate.saveDraft({ title: TITLE, proposalDeadline: momentsFromNow() });
  await surface.opportunitySwuEdit.open({ title: TITLE });
  await surface.opportunitySwuEdit.submitForReview();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuEdit.open({ title: TITLE });
  await surface.opportunitySwuEdit.publish();
  await surface.signOut();
}

test("the membership of an evaluation panel is shown to the opportunity's owner", async ({ surface }) => {
  await aPublishedOpportunityWithAPanel(surface);

  await surface.signIn(persona.publicSectorStaff);
  await surface.evaluationPanelSwu.open({ title: TITLE });

  expect(await surface.evaluationPanelSwu.panelMemberRow()).toContain(seed.users.staffPanelEvaluator.email);
});

test("the membership of an evaluation panel is shown to an administrator", async ({ surface }) => {
  await aPublishedOpportunityWithAPanel(surface);

  await surface.signIn(persona.administrator);
  await surface.evaluationPanelSwu.open({ title: TITLE });

  expect(await surface.evaluationPanelSwu.panelMemberRow()).toContain(seed.users.staffPanelEvaluator.email);
});

test("the membership of an evaluation panel is shown to the people on the panel itself", async ({ surface }) => {
  await aPublishedOpportunityWithAPanel(surface);

  await surface.signIn(persona.evaluationPanelEvaluator);
  await surface.evaluationPanelSwu.open({ title: TITLE });

  expect(await surface.evaluationPanelSwu.panelMemberRow()).toContain(seed.users.staffPanelEvaluator.email);
});

test("no panel membership is shown to a vendor", async ({ surface }) => {
  await aPublishedOpportunityWithAPanel(surface);

  await surface.signIn(persona.vendor);
  await surface.evaluationPanelSwu.open({ title: TITLE });

  expect(await surface.evaluationPanelSwu.panelMemberRow()).toBeFalsy();
});

test("no panel membership is shown to a public sector employee who is neither the owner nor on the panel", async ({ surface }) => {
  await aPublishedOpportunityWithAPanel(surface);

  await surface.signIn(persona.publicSectorStaffOther);
  await surface.evaluationPanelSwu.open({ title: TITLE });

  expect(await surface.evaluationPanelSwu.panelMemberRow()).toBeFalsy();
});
