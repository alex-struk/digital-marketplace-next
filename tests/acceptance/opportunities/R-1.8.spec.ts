// criterion: @R-1.8 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// One opportunity is created under each of the three programs and each is then looked
// for under all three program filters: an opportunity filed under one program is absent
// from the other two, which is what "exactly one of three" means from outside.
//
// That the program is never changed afterwards is not asserted. No action in the surface
// changes an opportunity's program, and the absence of an action is not an observation,
// so there is no request to make and nothing to read back.

const codeWithUs = "R-1.8 opportunity filed under Code With Us";
const sprintWithUs = "R-1.8 opportunity filed under Sprint With Us";
const teamWithUs = "R-1.8 opportunity filed under Team With Us";

test("every opportunity belongs to exactly one of three procurement programs, chosen when it is created", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);

  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseCodeWithUs();
  await surface.opportunityCwuCreate.saveDraft({ title: codeWithUs });

  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseSprintWithUs();
  await surface.opportunitySwuCreate.saveDraft({ title: sprintWithUs });

  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseTeamWithUs();
  await surface.opportunityTwuCreate.saveDraft({ title: teamWithUs });

  await surface.opportunityList.open();
  await surface.opportunityList.filterByProgram({ program: "Code With Us" });
  let listed = await surface.opportunityList.unpublishedGroup();
  expect(listed).toContain(codeWithUs);
  expect(listed).not.toContain(sprintWithUs);
  expect(listed).not.toContain(teamWithUs);

  await surface.opportunityList.open();
  await surface.opportunityList.filterByProgram({ program: "Sprint With Us" });
  listed = await surface.opportunityList.unpublishedGroup();
  expect(listed).toContain(sprintWithUs);
  expect(listed).not.toContain(codeWithUs);
  expect(listed).not.toContain(teamWithUs);

  await surface.opportunityList.open();
  await surface.opportunityList.filterByProgram({ program: "Team With Us" });
  listed = await surface.opportunityList.unpublishedGroup();
  expect(listed).toContain(teamWithUs);
  expect(listed).not.toContain(codeWithUs);
  expect(listed).not.toContain(sprintWithUs);
});

test("an opportunity offers only its own program's fields, stages and actions", async ({ surface }) => {
  const sprintTitle = "R-1.8 Sprint With Us opportunity and its own stages";
  const teamTitle = "R-1.8 Team With Us opportunity and its own stages";
  await surface.signIn(persona.publicSectorStaff);

  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseSprintWithUs();
  await surface.opportunitySwuCreate.saveDraft({ title: sprintTitle });

  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseTeamWithUs();
  await surface.opportunityTwuCreate.saveDraft({ title: teamTitle });

  // Sprint With Us is managed through its own stages — team questions, the code
  // challenge and the team scenario.
  await surface.opportunitySwuEdit.open({ title: sprintTitle });
  expect(await surface.opportunitySwuEdit.teamQuestionsTab()).toBeTruthy();
  expect(await surface.opportunitySwuEdit.teamScenarioTab()).toBeTruthy();

  // Team With Us through its own — resource questions and a single challenge, with no
  // team scenario of any kind.
  await surface.opportunityTwuEdit.open({ title: teamTitle });
  expect(await surface.opportunityTwuEdit.resourceQuestionsTab()).toBeTruthy();
  expect(await surface.opportunityTwuEdit.challengeTab()).toBeTruthy();
});
