// criterion: @R-5.17 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Both halves are read from the mail catcher, which is emptied at the moment the panel is
// about to change so that everything found afterwards belongs to that change and nothing
// else. The first test finds a message for the person newly added and none at all for the
// two who were already there, which is the whole of the criterion's claim; the second makes
// the same change on a draft and finds nothing for anybody.
//
// Emptying the catcher is itself a request to it, so a test that goes on to assert an
// absence has already shown the catcher was reachable, as observables.yaml asks.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const details = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(90),
  mandatorySkills: ["Frontend Development"],
  totalMaxBudget: 500000,
  questionsWeight: 25,
  codeChallengeWeight: 25,
  teamScenarioWeight: 25,
  priceWeight: 25,
};

const panel = {
  members: [seed.users.staffOne, seed.users.staffPanelEvaluator],
  chair: seed.users.staffPanelEvaluator,
};

async function prepareSprintWithUs(surface: Surface): Promise<void> {
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addPhase({
    phase: "Implementation",
    startDate: inDays(28),
    completionDate: inDays(90),
    maxBudget: 500000,
    capabilities: ["Frontend Development"],
  });
  await surface.opportunitySwuCreate.addTeamQuestion({
    question: "Describe how your team has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunitySwuCreate.setEvaluationPanel(panel);
}

test("when people are added to an evaluation panel, only the people newly added are notified", async ({
  surface,
  mail,
}) => {
  const title = "R-5.17 published opportunity whose panel gained a third person";

  await surface.signIn(persona.administrator);
  await prepareSprintWithUs(surface);
  await surface.opportunitySwuCreate.publish({ ...details, title });

  await mail.clear();

  await surface.evaluationPanelSwu.open({ title });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffTwo });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  await expect
    .poll(async () => (await mail.messagesTo(seed.users.staffTwo.email)).length, { timeout: 10000 })
    .toBeGreaterThan(0);

  expect((await mail.messagesTo(seed.users.staffOne.email)).length).toBe(0);
  expect((await mail.messagesTo(seed.users.staffPanelEvaluator.email)).length).toBe(0);
});

test("people added to an evaluation panel are notified only once the opportunity has left draft", async ({
  surface,
  mail,
}) => {
  const title = "R-5.17 draft opportunity given a panel";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title });

  await mail.clear();

  await surface.evaluationPanelSwu.open({ title });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffTwo });
  await surface.evaluationPanelSwu.markMemberAsChair({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect((await mail.messagesTo(seed.users.staffPanelEvaluator.email)).length).toBe(0);
  expect((await mail.messagesTo(seed.users.staffTwo.email)).length).toBe(0);
});
