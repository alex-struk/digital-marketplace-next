// criterion: @R-5.17 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const TITLE = "R-5.17 Sprint With Us opportunity gaining a third panel member";
const QUESTION = "Describe how your team would run the first sprint.";

function momentsFromNow(): string {
  return new Date(Date.now() + 10_000).toISOString();
}

// A panel of two: one evaluator and a separate chair.
async function aDraftWhosePanelNamesTwoPeople(surface: Surface) {
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
}

test("when people are added to an evaluation panel, only the people newly added are notified", async ({ surface, mail }) => {
  await aDraftWhosePanelNamesTwoPeople(surface);
  await surface.opportunitySwuEdit.open({ title: TITLE });
  await surface.opportunitySwuEdit.submitForReview();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuEdit.open({ title: TITLE });
  await surface.opportunitySwuEdit.publish();
  await surface.signOut();

  await mail.clear();

  await surface.signIn(persona.publicSectorStaff);
  await surface.evaluationPanelSwu.open({ title: TITLE });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.administratorOne });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await mail.messagesTo(seed.users.administratorOne.email)).not.toHaveLength(0);
  expect(await mail.messagesTo(seed.users.staffPanelEvaluator.email)).toHaveLength(0);
  expect(await mail.messagesTo(seed.users.staffPanelChair.email)).toHaveLength(0);
});

test("people added to an evaluation panel are notified only once the opportunity has left draft", async ({ surface, mail }) => {
  await aDraftWhosePanelNamesTwoPeople(surface);

  await mail.clear();

  await surface.evaluationPanelSwu.open({ title: TITLE });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.administratorOne });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await mail.messagesTo(seed.users.administratorOne.email)).toHaveLength(0);
  expect(await mail.messagesTo(seed.users.staffPanelEvaluator.email)).toHaveLength(0);
  expect(await mail.messagesTo(seed.users.staffPanelChair.email)).toHaveLength(0);
});
