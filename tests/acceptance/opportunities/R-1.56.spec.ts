// criterion: @R-1.56 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each opportunity is drafted, complete, by a member of public sector staff and published by an
// administrator, so the person whose change is refused is the employee who created it. The
// criterion says the same rule governs all three programs, so both halves are taken in each.
//
// The given is established before anybody changes anything: the draft was stored — the screen
// it lands on carries an identifier — and, once the administrator has published it, its own
// view reads it as published. Publication is not what this criterion governs, so where the
// target does not store the draft, or the publication does not take effect, the case is
// recorded as blocked rather than failed.
//
// A change is read off the opportunity tab of its management screen, as the administrator sees
// it afterwards: the administrator's own change is there; the author's attempted change is not,
// and what the opportunity said before is still there. The management screen names no error
// observation, so the refusal is read from what the opportunity shows.

const statement =
  "Once an opportunity is published, only an administrator may change its details; a request from the public sector employee who created it is refused, and the same rule governs Code With Us, Sprint With Us and Team With Us alike.";

const settle = { timeout: 15000 };

type Program = "codeWithUs" | "sprintWithUs" | "teamWithUs";
const names: Record<Program, string> = {
  codeWithUs: "Code With Us",
  sprintWithUs: "Sprint With Us",
  teamWithUs: "Team With Us",
};

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const shared = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "R-1.56 the description as it stood when the opportunity was published.",
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

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function landedIdentifier(read: () => Promise<string>): Promise<string> {
  try {
    await expect.poll(() => readOrEmpty(read), settle).toBeTruthy();
    return await readOrEmpty(read);
  } catch {
    return "";
  }
}

async function draft(surface: Surface, program: Program, title: string): Promise<string> {
  if (program === "codeWithUs") {
    await surface.opportunityCwuCreate.open();
    await surface.opportunityCwuCreate.saveDraft({ ...shared, title, reward: 5000, skills: ["Backend Development"] });
    return landedIdentifier(() => surface.opportunityCwuEdit.opportunityIdentifier());
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
    await surface.opportunitySwuCreate.saveDraft({
      ...shared,
      title,
      mandatorySkills: ["Backend Development"],
      totalMaxBudget: 500000,
      questionsWeight: 25,
      codeChallengeWeight: 40,
      teamScenarioWeight: 15,
      priceWeight: 20,
    });
    return landedIdentifier(() => surface.opportunitySwuEdit.opportunityIdentifier());
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
  await surface.opportunityTwuCreate.saveDraft({
    ...shared,
    title,
    maxBudget: 300000,
    questionsWeight: 30,
    challengeWeight: 40,
    priceWeight: 30,
  });
  return landedIdentifier(() => surface.opportunityTwuEdit.opportunityIdentifier());
}

async function status(surface: Surface, program: Program, opportunityId: string): Promise<string> {
  if (program === "codeWithUs") {
    await surface.opportunityCwuView.open({ opportunityId });
    return readOrEmpty(() => surface.opportunityCwuView.status());
  }
  if (program === "sprintWithUs") {
    await surface.opportunitySwuView.open({ opportunityId });
    return readOrEmpty(() => surface.opportunitySwuView.status());
  }
  await surface.opportunityTwuView.open({ opportunityId });
  return readOrEmpty(() => surface.opportunityTwuView.status());
}

function manage(surface: Surface, program: Program) {
  if (program === "codeWithUs") return surface.opportunityCwuEdit;
  if (program === "sprintWithUs") return surface.opportunitySwuEdit;
  return surface.opportunityTwuEdit;
}

// Drafted by the member of staff, published by the administrator, and read back as published.
// Leaves the administrator signed in.
async function publishedByAdministrator(surface: Surface, program: Program, title: string): Promise<string> {
  await surface.signIn(persona.publicSectorStaff);
  const opportunityId = await draft(surface, program, title);
  await surface.signOut();
  if (!opportunityId) {
    test.skip(true, `blocked: the target did not store the ${names[program]} draft, so there is no published opportunity to change`);
  }

  await surface.signIn(persona.administrator);
  await manage(surface, program).open({ opportunityId });
  try {
    await manage(surface, program).publish();
  } catch {
    // Whether it was published is read below.
  }
  let published = true;
  try {
    await expect.poll(() => status(surface, program, opportunityId), settle).toMatch(/publish/i);
  } catch {
    published = false;
  }
  if (!published) {
    test.skip(true, `blocked: the administrator's publication of the ${names[program]} opportunity did not take effect, so it never reached the state this criterion is about`);
  }
  return opportunityId;
}

async function shown(surface: Surface, program: Program, opportunityId: string): Promise<string> {
  await manage(surface, program).open({ opportunityId });
  return readOrEmpty(() => manage(surface, program).opportunityTab());
}

for (const program of Object.keys(names) as Program[]) {
  test(`${statement} (${names[program]}: an administrator changes the details of a published opportunity)`, async ({
    surface,
  }) => {
    const changed = `R-1.56 the ${names[program]} description an administrator put there.`;
    const opportunityId = await publishedByAdministrator(surface, program, `R-1.56 published ${names[program]} opportunity an administrator changed`);

    await manage(surface, program).open({ opportunityId });
    await manage(surface, program).editDetails({ description: changed });

    await expect.poll(() => shown(surface, program, opportunityId), settle).toContain(changed);
  });

  test(`${statement} (${names[program]}: the public sector employee who created a published opportunity is refused)`, async ({
    surface,
  }) => {
    const attempted = `R-1.56 the ${names[program]} description its author tried to put there.`;
    const opportunityId = await publishedByAdministrator(
      surface,
      program,
      `R-1.56 published ${names[program]} opportunity its author tried to change`,
    );
    await surface.signOut();

    await surface.signIn(persona.publicSectorStaff);
    await manage(surface, program).open({ opportunityId });
    try {
      await manage(surface, program).editDetails({ description: attempted });
    } catch {
      // A change the screen will not offer is refused; what the opportunity shows is read below.
    }
    await surface.signOut();

    await surface.signIn(persona.administrator);
    const after = await shown(surface, program, opportunityId);
    expect(after).not.toContain(attempted);
    expect(after).toContain(shared.description);
  });
}
