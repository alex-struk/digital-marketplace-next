// criterion: @R-1.53 v2
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Every opportunity a test builds is complete, so the service accepts it as a draft or as a
// submission for review in whichever program, and its state is read before anything is asked
// of it. Each clause of the rule is exercised in Code With Us, Sprint With Us and Team With Us
// alike, since the criterion says the one rule governs all three.
//
// A deletion is read as the opportunity no longer being listed to somebody certain to see it
// otherwise: its author on their own dashboard, or an administrator, who sees every
// opportunity. The listing is read until it settles. A refusal is read the other way round:
// the opportunity is still listed, and still in the state it was in. The member of staff is
// first shown to hold no administrator rights, since the rule for them differs from the rule
// for an administrator.

type Program = "codeWithUs" | "sprintWithUs" | "teamWithUs";
const programs: Program[] = ["codeWithUs", "sprintWithUs", "teamWithUs"];
const settle = { timeout: 15000 };

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

async function signInAsStaffWithoutAdministratorRights(surface: Surface): Promise<void> {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open({ userId: seed.users.staffOne.id });
  const permissions = (await surface.userProfile.permissionsLabel()).toLowerCase();
  expect(permissions).toBeTruthy();
  expect(permissions).not.toContain("admin");
}

// Builds a complete opportunity in the given program, either saved as a draft or submitted for
// review, and returns the identifier of the screen it lands on.
async function build(surface: Surface, program: Program, title: string, as: "draft" | "review"): Promise<string> {
  if (program === "codeWithUs") {
    await surface.opportunityCwuCreate.open();
    const content = { ...shared, title, reward: 5000, skills: ["Backend Development"] };
    if (as === "draft") await surface.opportunityCwuCreate.saveDraft(content);
    else await surface.opportunityCwuCreate.submitForReview(content);
    expect(await surface.opportunityCwuCreate.fieldError()).toBeFalsy();
    return surface.opportunityCwuEdit.opportunityIdentifier();
  }
  if (program === "sprintWithUs") {
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
    const content = {
      ...shared,
      title,
      mandatorySkills: ["Backend Development"],
      totalMaxBudget: 500000,
      questionsWeight: 25,
      codeChallengeWeight: 40,
      teamScenarioWeight: 15,
      priceWeight: 20,
    };
    if (as === "draft") await surface.opportunitySwuCreate.saveDraft(content);
    else await surface.opportunitySwuCreate.submitForReview(content);
    expect(await surface.opportunitySwuCreate.fieldError()).toBeFalsy();
    return surface.opportunitySwuEdit.opportunityIdentifier();
  }
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResource({ serviceArea: "Full Stack Developer", targetAllocation: 100 });
  await surface.opportunityTwuCreate.addResourceQuestion({
    question: "Describe how your resource has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunityTwuCreate.setEvaluationPanel(panel);
  const content = { ...shared, title, maxBudget: 300000, questionsWeight: 30, challengeWeight: 40, priceWeight: 30 };
  if (as === "draft") await surface.opportunityTwuCreate.saveDraft(content);
  else await surface.opportunityTwuCreate.submitForReview(content);
  expect(await surface.opportunityTwuCreate.fieldError()).toBeFalsy();
  return surface.opportunityTwuEdit.opportunityIdentifier();
}

async function status(surface: Surface, program: Program, opportunityId: string): Promise<string> {
  if (program === "codeWithUs") {
    await surface.opportunityCwuView.open({ opportunityId });
    return (await surface.opportunityCwuView.status()).toLowerCase();
  }
  if (program === "sprintWithUs") {
    await surface.opportunitySwuView.open({ opportunityId });
    return (await surface.opportunitySwuView.status()).toLowerCase();
  }
  await surface.opportunityTwuView.open({ opportunityId });
  return (await surface.opportunityTwuView.status()).toLowerCase();
}

async function askToDelete(surface: Surface, program: Program, opportunityId: string): Promise<void> {
  if (program === "codeWithUs") {
    await surface.opportunityCwuEdit.open({ opportunityId });
    await surface.opportunityCwuEdit.deleteOpportunity();
  } else if (program === "sprintWithUs") {
    await surface.opportunitySwuEdit.open({ opportunityId });
    await surface.opportunitySwuEdit.deleteOpportunity();
  } else {
    await surface.opportunityTwuEdit.open({ opportunityId });
    await surface.opportunityTwuEdit.deleteOpportunity();
  }
}

async function everythingAnAdministratorSees(surface: Surface): Promise<string> {
  await surface.opportunityDashboard.open();
  return surface.opportunityDashboard.allOpportunitiesForAdministrator();
}

async function ownOpportunities(surface: Surface): Promise<string> {
  await surface.opportunityDashboard.open();
  return surface.opportunityDashboard.myOpportunitiesTable();
}

test("an administrator may delete an opportunity while it is a draft, in Code With Us, Sprint With Us and Team With Us alike", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  for (const program of programs) {
    const title = `R-1.53 ${program} draft an administrator deleted`;
    const opportunityId = await build(surface, program, title, "draft");
    expect(await status(surface, program, opportunityId)).toContain("draft");
    expect(await everythingAnAdministratorSees(surface)).toContain(title);

    await askToDelete(surface, program, opportunityId);

    await expect.poll(() => everythingAnAdministratorSees(surface), settle).not.toContain(title);
  }
});

test("an administrator may delete an opportunity while it is under review, in Code With Us, Sprint With Us and Team With Us alike", async ({
  surface,
}) => {
  const built: Array<{ program: Program; title: string; opportunityId: string }> = [];

  await signInAsStaffWithoutAdministratorRights(surface);
  for (const program of programs) {
    const title = `R-1.53 ${program} opportunity under review an administrator deleted`;
    built.push({ program, title, opportunityId: await build(surface, program, title, "review") });
  }
  await surface.signOut();

  await surface.signIn(persona.administrator);
  for (const { program, title, opportunityId } of built) {
    expect(await status(surface, program, opportunityId)).toContain("review");
    expect(await everythingAnAdministratorSees(surface)).toContain(title);

    await askToDelete(surface, program, opportunityId);

    await expect.poll(() => everythingAnAdministratorSees(surface), settle).not.toContain(title);
  }
});

test("the public sector employee who created an opportunity may delete it while it is a draft, in Code With Us, Sprint With Us and Team With Us alike", async ({
  surface,
}) => {
  await signInAsStaffWithoutAdministratorRights(surface);

  for (const program of programs) {
    const title = `R-1.53 ${program} draft its author deleted`;
    const opportunityId = await build(surface, program, title, "draft");
    expect(await status(surface, program, opportunityId)).toContain("draft");
    expect(await ownOpportunities(surface)).toContain(title);

    await askToDelete(surface, program, opportunityId);

    await expect.poll(() => ownOpportunities(surface), settle).not.toContain(title);
  }
});

test("the public sector employee who created an opportunity may not delete it once it is under review, in Code With Us, Sprint With Us and Team With Us alike, and it remains", async ({
  surface,
}) => {
  await signInAsStaffWithoutAdministratorRights(surface);

  for (const program of programs) {
    const title = `R-1.53 ${program} opportunity under review its author asked to delete`;
    const opportunityId = await build(surface, program, title, "review");
    expect(await status(surface, program, opportunityId)).toContain("review");

    await askToDelete(surface, program, opportunityId);

    expect(await ownOpportunities(surface)).toContain(title);
    expect(await status(surface, program, opportunityId)).toContain("review");
  }
});

// The given is an opportunity that has been published at any point. The seed carries one in
// each program: a Code With Us opportunity still open, and a Sprint With Us and a Team With Us
// opportunity published and since closed. Both people who could plausibly be let delete them
// ask — their author, and an administrator — and each must still be there afterwards.
test("any other request to delete an opportunity, such as one that has been published, is refused and the opportunity remains", async ({
  surface,
}) => {
  const published: Array<{ program: Program; title: string; opportunityId: string }> = [
    { program: "codeWithUs", ...pick(seed.opportunities.publishedCodeWithUs) },
    { program: "sprintWithUs", ...pick(seed.opportunities.closedSprintWithUs) },
    { program: "teamWithUs", ...pick(seed.opportunities.closedTeamWithUs) },
  ];

  await signInAsStaffWithoutAdministratorRights(surface);
  for (const { program, opportunityId } of published) {
    const before = await status(surface, program, opportunityId);
    expect(before).not.toContain("draft");
    expect(before).not.toContain("review");
    await askToDelete(surface, program, opportunityId);
  }
  await surface.signOut();

  await surface.signIn(persona.administrator);
  for (const { program, opportunityId } of published) {
    await askToDelete(surface, program, opportunityId);
  }

  const listed = await everythingAnAdministratorSees(surface);
  for (const { program, title, opportunityId } of published) {
    expect(listed).toContain(title);
    expect(await status(surface, program, opportunityId)).toBeTruthy();
  }
});

function pick(record: { id: string; title: string }): { title: string; opportunityId: string } {
  return { title: record.title, opportunityId: record.id };
}
