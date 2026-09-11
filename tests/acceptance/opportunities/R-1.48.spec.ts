// criterion: @R-1.48 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The content offered is complete, so nothing but the requester's standing is left to
// refuse the creation. The refusal is read by an administrator afterwards, because only an
// administrator is certain to see an opportunity in whatever state it did or did not reach.
//
// The Sprint With Us and Team With Us attempts carry their programs' own parts — a phase or
// a resource, a question, a panel and weights totalling one hundred — so that a refusal
// there cannot be mistaken for an incomplete submission.

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

async function prepareSprintWithUs(surface: Surface): Promise<void> {
  await surface.opportunitySwuCreate.open();
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
}

async function prepareTeamWithUs(surface: Surface): Promise<void> {
  await surface.opportunityTwuCreate.open();
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
}

test("creating an opportunity with its state set to published is refused unless the requester is an administrator", async ({
  surface,
}) => {
  const codeWithUs = "R-1.48 Code With Us opportunity a member of staff tried to create as published";
  const sprintWithUs = "R-1.48 Sprint With Us opportunity a member of staff tried to create as published";
  const teamWithUs = "R-1.48 Team With Us opportunity a member of staff tried to create as published";

  await surface.signIn(persona.publicSectorStaff);

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    ...shared,
    title: codeWithUs,
    reward: 5000,
    skills: ["Backend Development"],
  });

  await prepareSprintWithUs(surface);
  await surface.opportunitySwuCreate.publish({
    ...shared,
    title: sprintWithUs,
    mandatorySkills: ["Backend Development"],
    totalMaxBudget: 500000,
    questionsWeight: 25,
    codeChallengeWeight: 40,
    teamScenarioWeight: 15,
    priceWeight: 20,
  });

  await prepareTeamWithUs(surface);
  await surface.opportunityTwuCreate.publish({
    ...shared,
    title: teamWithUs,
    maxBudget: 300000,
    questionsWeight: 30,
    challengeWeight: 40,
    priceWeight: 30,
  });
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityList.open();
  const open = await surface.opportunityList.openGroup();
  expect(open).not.toContain(codeWithUs);
  expect(open).not.toContain(sprintWithUs);
  expect(open).not.toContain(teamWithUs);
});

test("a public sector employee who is not an administrator may create an opportunity as a draft, in all three programs", async ({
  surface,
}) => {
  const codeWithUs = "R-1.48 Code With Us draft created by an ordinary member of staff";
  const sprintWithUs = "R-1.48 Sprint With Us draft created by an ordinary member of staff";
  const teamWithUs = "R-1.48 Team With Us draft created by an ordinary member of staff";

  await surface.signIn(persona.publicSectorStaff);

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title: codeWithUs });
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title: sprintWithUs });
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.saveDraft({ title: teamWithUs });

  await surface.opportunityList.open();
  const unpublished = await surface.opportunityList.unpublishedGroup();
  expect(unpublished).toContain(codeWithUs);
  expect(unpublished).toContain(sprintWithUs);
  expect(unpublished).toContain(teamWithUs);
});

test("a public sector employee who is not an administrator may create an opportunity under review", async ({
  surface,
}) => {
  const title = "R-1.48 Code With Us opportunity created under review";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.submitForReview({
    ...shared,
    title,
    reward: 5000,
    skills: ["Backend Development"],
  });

  await surface.opportunityList.open();
  expect(await surface.opportunityList.unpublishedGroup()).toContain(title);
});
