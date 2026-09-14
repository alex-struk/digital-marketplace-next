// criterion: @R-5.9 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";

// A panel of two public sector employees, correct in every other respect, is offered with
// nobody marked as chair, so the missing chair is the only thing that can be refused. The
// refusal is read from missing_chair_error, the observation named for exactly this rule.
//
// From outside there is one refusal, not two: a test drives the browser form and cannot
// send a panel past it, so what is asserted here is that a chairless panel is refused, not
// which of the two layers refused it. That the service applies the rule as well as the form
// is the half of this criterion a blind test cannot reach on its own; it would need an
// action that saves a panel the form would not submit.
//
// The consequence the criterion gives as its reason — that no opportunity may enter
// consensus with nobody able to record the agreed score — is not asserted. The opportunity
// this test builds is a draft, and only the two seeded opportunities can be taken as far as
// consensus, so a chairless panel can never be carried to the stage it would spoil.

test("the service must reject an evaluation panel that names no chair", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({
    title: "R-5.9 opportunity whose panel names no chair",
  });
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();

  await surface.evaluationPanelSwu.open({ opportunityId });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffTwo });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.missingChairError()).toBeTruthy();
});
