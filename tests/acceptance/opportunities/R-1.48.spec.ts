// criterion: @R-1.48 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The requester is the public sector employee persona. That they hold no administrator rights
// is read from the kind of account their own profile shows, which every account carries. The
// content offered is complete, and each program's own parts — a phase or a resource, a
// question, a panel and weights totalling one hundred — are included, so nothing but the
// requester's standing is left to decide the outcome.
//
// Creating as published is read as refused when, after a pause long enough for a slow
// creation to land, the administrator — who sees every opportunity — finds it neither among
// the open opportunities nor published under any identifier it landed on.
//
// Creating as a draft or under review is read by first establishing that the opportunity was
// stored — the screen it lands on carries an identifier — and only then reading its state off
// its own view. Where the target does not store a Team With Us opportunity at all, for a reason
// this criterion does not govern, that case is recorded as blocked.

const statement =
  "Creating an opportunity with its state set to published is refused unless the requester is an administrator; a public sector employee who is not an administrator may create an opportunity only as a draft or under review, in all three programs.";

const settle = { timeout: 15000 };
const quietPeriod = 5000;

type Program = "codeWithUs" | "sprintWithUs" | "teamWithUs";
type As = "draft" | "review" | "published";
type CreateForm = Surface["opportunityCwuCreate"] | Surface["opportunitySwuCreate"] | Surface["opportunityTwuCreate"];

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

async function signInAsStaffWithoutAdministratorRights(surface: Surface): Promise<void> {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfileSelf.open();
  const kind = await surface.userProfileSelf.accountType();
  expect(kind).toBeTruthy();
  expect(kind.toLowerCase()).not.toContain("admin");
}

// Offers a complete opportunity in the program as the given state, and returns the identifier
// of the screen it lands on, or an empty string when it lands on none.
async function create(surface: Surface, program: Program, title: string, as: As): Promise<string> {
  async function offer(form: CreateForm, content: Record<string, unknown>): Promise<void> {
    try {
      if (as === "draft") await form.saveDraft(content);
      else if (as === "review") await form.submitForReview(content);
      else await form.publish(content);
    } catch {
      // An action the form will not offer is read below as the opportunity landing nowhere.
    }
  }

  if (program === "codeWithUs") {
    await surface.opportunityCwuCreate.open();
    await offer(surface.opportunityCwuCreate, { ...shared, title, reward: 5000, skills: ["Backend Development"] });
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
    await offer(surface.opportunitySwuCreate, {
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
  await offer(surface.opportunityTwuCreate, {
    ...shared,
    title,
    maxBudget: 300000,
    questionsWeight: 30,
    challengeWeight: 40,
    priceWeight: 30,
  });
  return landedIdentifier(() => surface.opportunityTwuEdit.opportunityIdentifier());
}

async function state(surface: Surface, program: Program, opportunityId: string): Promise<string> {
  if (program === "codeWithUs") {
    await surface.opportunityCwuView.open({ opportunityId });
    return (await readOrEmpty(() => surface.opportunityCwuView.status())).toLowerCase();
  }
  if (program === "sprintWithUs") {
    await surface.opportunitySwuView.open({ opportunityId });
    return (await readOrEmpty(() => surface.opportunitySwuView.status())).toLowerCase();
  }
  await surface.opportunityTwuView.open({ opportunityId });
  return (await readOrEmpty(() => surface.opportunityTwuView.status())).toLowerCase();
}

for (const program of Object.keys(names) as Program[]) {
  test(`${statement} (${names[program]}: created as published by a public sector employee who is not an administrator, refused)`, async ({
    surface,
  }) => {
    const title = `R-1.48 ${names[program]} opportunity a member of staff tried to create as published`;

    await signInAsStaffWithoutAdministratorRights(surface);
    const opportunityId = await create(surface, program, title, "published");
    await surface.signOut();

    await new Promise((resolve) => setTimeout(resolve, quietPeriod));
    await surface.signIn(persona.administrator);
    await surface.opportunityList.open();
    expect(await surface.opportunityList.openGroup()).not.toContain(title);
    if (opportunityId) expect(await state(surface, program, opportunityId)).not.toMatch(/publish/);
  });

  test(`${statement} (${names[program]}: created as a draft by a public sector employee who is not an administrator)`, async ({
    surface,
  }) => {
    const title = `R-1.48 ${names[program]} draft created by an ordinary member of staff`;

    await signInAsStaffWithoutAdministratorRights(surface);
    const opportunityId = await create(surface, program, title, "draft");
    if (program === "teamWithUs" && !opportunityId) {
      test.skip(true, "blocked: the target did not store the Team With Us draft, so who may create one cannot be read");
    }
    expect(opportunityId).toBeTruthy();

    await expect.poll(() => state(surface, program, opportunityId), settle).toContain("draft");
  });

  test(`${statement} (${names[program]}: created under review by a public sector employee who is not an administrator)`, async ({
    surface,
  }) => {
    const title = `R-1.48 ${names[program]} opportunity created under review by an ordinary member of staff`;

    await signInAsStaffWithoutAdministratorRights(surface);
    const opportunityId = await create(surface, program, title, "review");
    if (program === "teamWithUs" && !opportunityId) {
      test.skip(true, "blocked: the target did not store the Team With Us opportunity, so who may create one under review cannot be read");
    }
    expect(opportunityId).toBeTruthy();

    await expect.poll(() => state(surface, program, opportunityId), settle).toContain("review");
  });
}
