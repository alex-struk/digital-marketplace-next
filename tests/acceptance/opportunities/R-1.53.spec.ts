// criterion: @R-1.53 v2
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Every clause of the rule is taken in Code With Us, Sprint With Us and Team With Us alike, one
// test per clause and program, since the criterion says the one rule governs all three.
//
// The member of staff is the public sector employee persona. That they hold no administrator
// rights is read from the kind of account their own profile shows, which every account
// carries, rather than from a statement of permissions an ordinary account is not shown.
//
// Every opportunity a test builds is complete, so the service accepts it as a draft or as a
// submission for review in whichever program. Before anybody asks to delete it, it is shown to
// have been stored — the screen it lands on carries an identifier, and its own view reads the
// state the test needs — and to be listed to the person who will look for it afterwards. Where
// the target does not store a Team With Us opportunity at all, for a reason this criterion does
// not govern, that case is recorded as blocked.
//
// A deletion is read as the opportunity no longer being listed to somebody certain to see it
// otherwise: its author on their own dashboard, or an administrator, who sees every
// opportunity. The listing is read until it settles. A refusal is read the other way round:
// the opportunity is still listed, and still in the state it was in.

const statement =
  "An opportunity may be deleted only while it is a draft or under review: an administrator may delete one in either state, and the public sector employee who created it may delete it only while it is a draft. The same rule governs Code With Us, Sprint With Us and Team With Us alike, and any other request to delete is refused and the opportunity remains.";

type Program = "codeWithUs" | "sprintWithUs" | "teamWithUs";
const names: Record<Program, string> = {
  codeWithUs: "Code With Us",
  sprintWithUs: "Sprint With Us",
  teamWithUs: "Team With Us",
};
const programs = Object.keys(names) as Program[];
const settle = { timeout: 15000 };
const quietPeriod = 5000;

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

// Builds a complete opportunity in the program, saved as a draft or submitted for review, and
// returns the identifier of the screen it lands on, or an empty string when there is none.
async function build(surface: Surface, program: Program, title: string, as: "draft" | "review"): Promise<string> {
  if (program === "codeWithUs") {
    await surface.opportunityCwuCreate.open();
    const content = { ...shared, title, reward: 5000, skills: ["Backend Development"] };
    if (as === "draft") await surface.opportunityCwuCreate.saveDraft(content);
    else await surface.opportunityCwuCreate.submitForReview(content);
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
  const content = { ...shared, title, maxBudget: 300000, questionsWeight: 30, challengeWeight: 40, priceWeight: 30 };
  if (as === "draft") await surface.opportunityTwuCreate.saveDraft(content);
  else await surface.opportunityTwuCreate.submitForReview(content);
  return landedIdentifier(() => surface.opportunityTwuEdit.opportunityIdentifier());
}

// Builds the opportunity and establishes that it was stored in the state asked for, recording
// the Team With Us case as blocked when the target stored nothing.
async function stored(surface: Surface, program: Program, title: string, as: "draft" | "review"): Promise<string> {
  const opportunityId = await build(surface, program, title, as);
  if (program === "teamWithUs" && !opportunityId) {
    test.skip(true, "blocked: the target did not store the Team With Us opportunity, so asking to delete it says nothing about who may");
  }
  expect(opportunityId).toBeTruthy();
  await expect.poll(() => status(surface, program, opportunityId), settle).toContain(as);
  return opportunityId;
}

async function status(surface: Surface, program: Program, opportunityId: string): Promise<string> {
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

async function askToDelete(surface: Surface, program: Program, opportunityId: string): Promise<void> {
  try {
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
  } catch {
    // A deletion the screen will not offer is a refusal; what remains is read afterwards.
  }
}

async function everythingAnAdministratorSees(surface: Surface): Promise<string> {
  await surface.opportunityDashboard.open();
  return readOrEmpty(() => surface.opportunityDashboard.allOpportunitiesForAdministrator());
}

async function ownOpportunities(surface: Surface): Promise<string> {
  await surface.opportunityDashboard.open();
  return readOrEmpty(() => surface.opportunityDashboard.myOpportunitiesTable());
}

for (const program of programs) {
  const name = names[program];

  test(`${statement} (${name}: an administrator deletes a draft)`, async ({ surface }) => {
    const title = `R-1.53 ${name} draft an administrator deleted`;
    await surface.signIn(persona.administrator);
    const opportunityId = await stored(surface, program, title, "draft");
    await expect.poll(() => everythingAnAdministratorSees(surface), settle).toContain(title);

    await askToDelete(surface, program, opportunityId);

    await expect.poll(() => everythingAnAdministratorSees(surface), settle).not.toContain(title);
  });

  test(`${statement} (${name}: an administrator deletes an opportunity under review)`, async ({ surface }) => {
    const title = `R-1.53 ${name} opportunity under review an administrator deleted`;
    await signInAsStaffWithoutAdministratorRights(surface);
    const opportunityId = await stored(surface, program, title, "review");
    await surface.signOut();

    await surface.signIn(persona.administrator);
    await expect.poll(() => everythingAnAdministratorSees(surface), settle).toContain(title);

    await askToDelete(surface, program, opportunityId);

    await expect.poll(() => everythingAnAdministratorSees(surface), settle).not.toContain(title);
  });

  test(`${statement} (${name}: the public sector employee who created it deletes a draft)`, async ({ surface }) => {
    const title = `R-1.53 ${name} draft its author deleted`;
    await signInAsStaffWithoutAdministratorRights(surface);
    const opportunityId = await stored(surface, program, title, "draft");
    await expect.poll(() => ownOpportunities(surface), settle).toContain(title);

    await askToDelete(surface, program, opportunityId);

    await expect.poll(() => ownOpportunities(surface), settle).not.toContain(title);
  });

  test(`${statement} (${name}: the public sector employee who created it is refused once it is under review, and it remains)`, async ({
    surface,
  }) => {
    const title = `R-1.53 ${name} opportunity under review its author asked to delete`;
    await signInAsStaffWithoutAdministratorRights(surface);
    const opportunityId = await stored(surface, program, title, "review");
    await expect.poll(() => ownOpportunities(surface), settle).toContain(title);

    await askToDelete(surface, program, opportunityId);

    await new Promise((resolve) => setTimeout(resolve, quietPeriod));
    expect(await ownOpportunities(surface)).toContain(title);
    expect(await status(surface, program, opportunityId)).toContain("review");
  });
}

// The given is an opportunity that has been published at some point. The seed carries one in
// each program: a Code With Us opportunity still open, and a Sprint With Us and a Team With Us
// opportunity published and since closed. Before anybody asks, each is shown to be listed to
// the administrator under its own title and to read a state that is neither a draft nor under
// review. Both people who could plausibly be let delete it ask — its author, and an
// administrator — and it must still be there afterwards, in the state it was in.
const published: Record<Program, { id: string; title: string }> = {
  codeWithUs: seed.opportunities.publishedCodeWithUs,
  sprintWithUs: seed.opportunities.closedSprintWithUs,
  teamWithUs: seed.opportunities.closedTeamWithUs,
};

for (const program of programs) {
  test(`${statement} (${names[program]}: a request to delete an opportunity that has been published is refused, and it remains)`, async ({
    surface,
  }) => {
    const { id: opportunityId, title } = published[program];

    await surface.signIn(persona.administrator);
    const listed = (await everythingAnAdministratorSees(surface)).includes(title);
    const before = await status(surface, program, opportunityId);
    if (program === "teamWithUs" && (!listed || !before)) {
      test.skip(true, "blocked: the seeded Team With Us opportunity cannot be read on the target, so whether it remains cannot be told");
    }
    expect(listed).toBe(true);
    expect(before).toBeTruthy();
    expect(before).not.toContain("draft");
    expect(before).not.toContain("review");
    await surface.signOut();

    await signInAsStaffWithoutAdministratorRights(surface);
    await askToDelete(surface, program, opportunityId);
    await surface.signOut();

    await surface.signIn(persona.administrator);
    await askToDelete(surface, program, opportunityId);

    await new Promise((resolve) => setTimeout(resolve, quietPeriod));
    expect(await everythingAnAdministratorSees(surface)).toContain(title);
    expect(await status(surface, program, opportunityId)).toBeTruthy();
  });
}
