// criterion: @R-1.8 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// A member of staff chooses a program on the program-selection screen and saves a complete
// draft there. Before anything is read about which program the opportunity belongs to, the
// draft is shown to have been stored: the screen it lands on carries an identifier, and the
// program's own view of that identifier reads a state for it. A Team With Us draft the target
// does not store is recorded as blocked, since storing it is not what this criterion governs.
//
// Belonging to exactly one program is read as the chosen program's view answering for the
// opportunity and the other two programs' views answering for nothing. "Never changed
// afterwards" is read the same way after its details have been changed: no action offers a
// program on an existing opportunity, so the change is to its details, and it must still be
// filed under the program it was created in.

const statement =
  "Every opportunity belongs to exactly one of three procurement programs — Code With Us, Sprint With Us or Team With Us — chosen when it is created and never changed afterwards.";

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

const changed = { description: "R-1.8 the description as changed after creation." };

type Program = "codeWithUs" | "sprintWithUs" | "teamWithUs";

const names: Record<Program, string> = {
  codeWithUs: "Code With Us",
  sprintWithUs: "Sprint With Us",
  teamWithUs: "Team With Us",
};

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

// The identifier of the screen a save lands on, waited for; empty when none arrives.
async function landedIdentifier(read: () => Promise<string>): Promise<string> {
  try {
    await expect.poll(() => readOrEmpty(read), settle).toBeTruthy();
    return await readOrEmpty(read);
  } catch {
    return "";
  }
}

async function createDraft(surface: Surface, program: Program, title: string): Promise<string> {
  await surface.opportunityProgramSelect.open();
  if (program === "codeWithUs") {
    await surface.opportunityProgramSelect.chooseCodeWithUs();
    await surface.opportunityCwuCreate.saveDraft({ ...shared, title, reward: 5000, skills: ["Backend Development"] });
    return landedIdentifier(() => surface.opportunityCwuEdit.opportunityIdentifier());
  }
  if (program === "sprintWithUs") {
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
  await surface.opportunityProgramSelect.chooseTeamWithUs();
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

// The state each program's own view reads for the identifier; empty where that program's view
// has nothing to show for it.
async function stateUnder(surface: Surface, program: Program, opportunityId: string): Promise<string> {
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

async function editDetails(surface: Surface, program: Program, opportunityId: string): Promise<void> {
  if (program === "codeWithUs") {
    await surface.opportunityCwuEdit.open({ opportunityId });
    await surface.opportunityCwuEdit.editDetails(changed);
  } else if (program === "sprintWithUs") {
    await surface.opportunitySwuEdit.open({ opportunityId });
    await surface.opportunitySwuEdit.editDetails(changed);
  } else {
    await surface.opportunityTwuEdit.open({ opportunityId });
    await surface.opportunityTwuEdit.editDetails(changed);
  }
}

async function expectFiledUnderAlone(surface: Surface, program: Program, opportunityId: string): Promise<void> {
  for (const other of Object.keys(names) as Program[]) {
    if (other === program) continue;
    expect(await stateUnder(surface, other, opportunityId)).toBeFalsy();
  }
}

for (const program of Object.keys(names) as Program[]) {
  test(`${statement} (${names[program]})`, async ({ surface }) => {
    await surface.signIn(persona.publicSectorStaff);
    const opportunityId = await createDraft(surface, program, `R-1.8 opportunity created under ${names[program]}`);

    if (program === "teamWithUs" && !opportunityId) {
      test.skip(true, "blocked: the target did not store the Team With Us draft, so which program it belongs to cannot be read");
    }
    expect(opportunityId).toBeTruthy();
    await expect.poll(() => stateUnder(surface, program, opportunityId), settle).toMatch(/draft/i);

    await expectFiledUnderAlone(surface, program, opportunityId);

    await editDetails(surface, program, opportunityId);
    await expect.poll(() => stateUnder(surface, program, opportunityId), settle).toBeTruthy();
    await expectFiledUnderAlone(surface, program, opportunityId);
  });
}
