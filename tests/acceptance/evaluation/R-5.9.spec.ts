// criterion: @R-5.9 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona, seed } from "../../fixtures";

// A panel of two public sector employees, correct in every other respect, is offered with
// nobody marked as chair, so the missing chair is the only thing that can be refused. The
// refusal is read from missing_chair_error, the observation named for exactly this rule.
//
// From outside there is one refusal, not two: a test drives the browser form and cannot
// send a panel past it, so what is asserted here is that a chairless panel is refused, not
// which of the two layers refused it. That the service applies the rule as well as the form
// is the half of this criterion a blind test cannot reach on its own.
//
// The consequence the criterion gives as its reason — that no opportunity may enter
// consensus with nobody able to record the agreed score — is not asserted either. The
// consensus stage is reached only after an opportunity closes at its proposal deadline, and
// no page, action or observation in the surface brings that about (see R-1.1).

test("the service must reject an evaluation panel that names no chair", async ({ surface }) => {
  const title = "R-5.9 opportunity whose panel names no chair";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title });

  await surface.evaluationPanelSwu.open({ title });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffTwo });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.missingChairError()).toBeTruthy();
});
