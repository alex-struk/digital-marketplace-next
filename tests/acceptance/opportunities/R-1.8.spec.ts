// criterion: @R-1.8 v1
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each draft is saved complete, so that the service accepts it whatever it asks of a draft in
// that program, and its acceptance is established (no fault named, an identifier of its own)
// before anything is read about its program.
//
// Each program has a field of its own that the other two do not name: a reward for Code With
// Us, a total maximum budget for Sprint With Us, a maximum budget for Team With Us. Being filed
// under one program is read as that program's screen answering for the opportunity and the
// other two programs' screens answering for nothing. "Never changed afterwards" is read the
// same way after the opportunity has been changed: no action offers a program on an existing
// opportunity, so the change made is to its details, and it must still be filed under the
// program it was created in.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const shared = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(90),
};

const panel = {
  members: [seed.users.staffOne, seed.users.administratorOne],
  chair: seed.users.administratorOne,
};

const changed = { description: "R-1.8 the description as changed after creation." };

async function filedUnderCodeWithUsAlone(surface: Surface, opportunityId: string): Promise<void> {
  await surface.opportunityCwuView.open({ opportunityId });
  expect(await surface.opportunityCwuView.reward()).toBeTruthy();
  await surface.opportunitySwuView.open({ opportunityId });
  expect(await surface.opportunitySwuView.totalMaxBudget()).toBeFalsy();
  await surface.opportunityTwuView.open({ opportunityId });
  expect(await surface.opportunityTwuView.maxBudget()).toBeFalsy();
}

async function filedUnderSprintWithUsAlone(surface: Surface, opportunityId: string): Promise<void> {
  await surface.opportunitySwuView.open({ opportunityId });
  expect(await surface.opportunitySwuView.totalMaxBudget()).toBeTruthy();
  await surface.opportunityCwuView.open({ opportunityId });
  expect(await surface.opportunityCwuView.reward()).toBeFalsy();
  await surface.opportunityTwuView.open({ opportunityId });
  expect(await surface.opportunityTwuView.maxBudget()).toBeFalsy();
}

async function filedUnderTeamWithUsAlone(surface: Surface, opportunityId: string): Promise<void> {
  await surface.opportunityTwuView.open({ opportunityId });
  expect(await surface.opportunityTwuView.maxBudget()).toBeTruthy();
  await surface.opportunityCwuView.open({ opportunityId });
  expect(await surface.opportunityCwuView.reward()).toBeFalsy();
  await surface.opportunitySwuView.open({ opportunityId });
  expect(await surface.opportunitySwuView.totalMaxBudget()).toBeFalsy();
}

test("an opportunity created under Code With Us belongs to that program alone, and is never changed afterwards", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseCodeWithUs();
  await surface.opportunityCwuCreate.saveDraft({
    ...shared,
    title: "R-1.8 opportunity created under Code With Us",
    reward: 5000,
    skills: ["Backend Development"],
  });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeFalsy();
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  expect(opportunityId).toBeTruthy();

  await filedUnderCodeWithUsAlone(surface, opportunityId);

  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.editDetails(changed);
  await filedUnderCodeWithUsAlone(surface, opportunityId);
});

test("an opportunity created under Sprint With Us belongs to that program alone, and is never changed afterwards", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseSprintWithUs();
  await surface.opportunitySwuCreate.addPhase({
    phase: "Implementation",
    startDate: inDays(28),
    completionDate: inDays(90),
    maxBudget: 500000,
  });
  await surface.opportunitySwuCreate.addTeamQuestion({
    question: "Describe how your team has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunitySwuCreate.setEvaluationPanel(panel);
  await surface.opportunitySwuCreate.saveDraft({
    ...shared,
    title: "R-1.8 opportunity created under Sprint With Us",
    mandatorySkills: ["Backend Development"],
    totalMaxBudget: 500000,
    questionsWeight: 25,
    codeChallengeWeight: 40,
    teamScenarioWeight: 15,
    priceWeight: 20,
  });
  expect(await surface.opportunitySwuCreate.fieldError()).toBeFalsy();
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();
  expect(opportunityId).toBeTruthy();

  await filedUnderSprintWithUsAlone(surface, opportunityId);

  await surface.opportunitySwuEdit.open({ opportunityId });
  await surface.opportunitySwuEdit.editDetails(changed);
  await filedUnderSprintWithUsAlone(surface, opportunityId);
});

test("an opportunity created under Team With Us belongs to that program alone, and is never changed afterwards", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseTeamWithUs();
  await surface.opportunityTwuCreate.addResource({
    serviceArea: "Full Stack Developer",
    targetAllocation: 100,
  });
  await surface.opportunityTwuCreate.addResourceQuestion({
    question: "Describe how your resource has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunityTwuCreate.setEvaluationPanel(panel);
  await surface.opportunityTwuCreate.saveDraft({
    ...shared,
    title: "R-1.8 opportunity created under Team With Us",
    maxBudget: 300000,
    questionsWeight: 30,
    challengeWeight: 40,
    priceWeight: 30,
  });
  expect(await surface.opportunityTwuCreate.fieldError()).toBeFalsy();
  const opportunityId = await surface.opportunityTwuEdit.opportunityIdentifier();
  expect(opportunityId).toBeTruthy();

  await filedUnderTeamWithUsAlone(surface, opportunityId);

  await surface.opportunityTwuEdit.open({ opportunityId });
  await surface.opportunityTwuEdit.editDetails(changed);
  await filedUnderTeamWithUsAlone(surface, opportunityId);
});
