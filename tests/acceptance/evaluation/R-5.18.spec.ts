// criterion: @R-5.18 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Membership is read as panel_member_row being there or not being there. Which people a
// panel names is not readable — the observation returns the rows, not the people a test
// asked for — so each test is built so that presence and absence are the whole answer: the
// panel is named on the opportunity before anybody looks, and the only thing that varies is
// who is looking.
//
// Who can be looked with is narrow. The target mints a session for one public sector
// employee besides the administrator, so the panel member who is neither owner nor
// administrator has to be that same account, and the unrelated public sector employee has
// to be an opportunity that account is neither the owner of nor on the panel of. The two
// tests that withhold the panel use a published opportunity, so that the person looking can
// open the opportunity itself and the panel is the only thing they are refused.

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

// Neither of these two accounts can be signed in as on this target, so a panel of the two
// of them is a panel that nobody a test can act as sits on.
const panelOfStrangers = {
  members: [seed.users.staffPanelEvaluator, seed.users.staffPanelChair],
  chair: seed.users.staffPanelChair,
};

async function draftWithPanel(surface: Surface, title: string): Promise<void> {
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title });
  await surface.evaluationPanelSwu.open({ title });
  for (const member of panelOfStrangers.members) {
    await surface.evaluationPanelSwu.addPanelMember({ member });
  }
  await surface.evaluationPanelSwu.markMemberAsChair({ member: panelOfStrangers.chair });
  await surface.evaluationPanelSwu.saveEvaluationPanel();
}

async function publishedWithPanel(surface: Surface, title: string): Promise<void> {
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
  await surface.opportunitySwuCreate.setEvaluationPanel(panelOfStrangers);
  await surface.opportunitySwuCreate.publish({ ...details, title });
}

test("the membership of an evaluation panel is shown to the opportunity's owner", async ({
  surface,
}) => {
  const title = "R-5.18 opportunity whose owner reads its panel";

  await surface.signIn(persona.publicSectorStaff);
  await draftWithPanel(surface, title);

  await surface.evaluationPanelSwu.open({ title });
  expect(await surface.evaluationPanelSwu.panelMemberRow()).toBeTruthy();
});

test("the membership of an evaluation panel is shown to an administrator", async ({ surface }) => {
  const title = "R-5.18 opportunity whose panel an administrator reads";

  await surface.signIn(persona.publicSectorStaff);
  await draftWithPanel(surface, title);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.evaluationPanelSwu.open({ title });
  expect(await surface.evaluationPanelSwu.panelMemberRow()).toBeTruthy();
});

test("the membership of an evaluation panel is shown to the people on the panel itself", async ({
  surface,
}) => {
  const title = "R-5.18 opportunity whose panel one of its own members reads";

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title });
  await surface.evaluationPanelSwu.open({ title });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffOne });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.markMemberAsChair({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.saveEvaluationPanel();
  await surface.signOut();

  await surface.signIn(persona.evaluationPanelEvaluator);
  await surface.evaluationPanelSwu.open({ title });
  expect(await surface.evaluationPanelSwu.panelMemberRow()).toBeTruthy();
});

test("no panel membership is shown to a public sector employee who is neither the owner nor on the panel", async ({
  surface,
}) => {
  const title = "R-5.18 opportunity an unrelated public sector employee asked for the panel of";

  await surface.signIn(persona.administrator);
  await publishedWithPanel(surface, title);
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await surface.evaluationPanelSwu.open({ title });
  expect(await surface.evaluationPanelSwu.panelMemberRow()).toBeFalsy();
});

test("no panel membership is shown to a vendor", async ({ surface }) => {
  const title = "R-5.18 opportunity a vendor asked for the panel of";

  await surface.signIn(persona.administrator);
  await publishedWithPanel(surface, title);
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await surface.evaluationPanelSwu.open({ title });
  expect(await surface.evaluationPanelSwu.panelMemberRow()).toBeFalsy();
});
