// criterion: @R-1.17 v3
// provenance: blind, spec@acd83ccd5eee6a143e0a2a1ac526de5e5a118a6a, derived 2026-09-30
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Every opportunity submitted below is complete in every other respect — dates, phase or
// resource, weights totalling one hundred, an evaluation panel — and every question on it is
// well formed but for the one field under test, so a refusal can only be that field's doing,
// and the refusal must name it. No question carries a position: the criterion says the
// person never enters one.
//
// The limits are enforced on submission for review and on publication, and not on saving a
// draft. Each field is taken on submission for review by the opportunity's author; the
// minimum score is taken on both programs, since the two differ only in name; publication by
// an administrator is taken once on each program. The draft half saves a question outside
// several limits at once and reads it back from the saved draft.
//
// A position runs from 0 to 100 and is set by the question's place, so the only question
// whose position falls outside it is the hundred-and-second. If the form will not take that
// question at all, it is refused just the same, since it is never held.

const statement =
  "Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position (0 to 100) is set by its place in the opportunity's list of questions and is never entered by the person. These limits are enforced when the opportunity is submitted for review or published, where a question outside them is refused and the offending field is named; saving the opportunity as a draft does not apply them, so a draft may be saved holding a question outside these limits.";

const settle = { timeout: 15000 };

function inDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toLocaleDateString("en-CA", { timeZone: "America/Vancouver" });
}

const sound = {
  question: "Describe how your team has delivered work of this kind before.",
  guideline: "Answer with one worked example.",
  score: 20,
  wordLimit: 300,
};

const shared = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
};

const sprintWithUsDetails = {
  ...shared,
  mandatorySkills: ["Backend Development"],
  totalMaxBudget: 1000000,
  questionsWeight: 25,
  codeChallengeWeight: 40,
  teamScenarioWeight: 15,
  priceWeight: 20,
};

const teamWithUsDetails = {
  ...shared,
  startDate: inDays(28),
  completionDate: inDays(90),
  maxBudget: 1000000,
  questionsWeight: 40,
  challengeWeight: 40,
  priceWeight: 20,
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

async function prepareSprintWithUs(surface: Surface, questions: Array<Record<string, unknown>>): Promise<void> {
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addPhase({
    phase: "Implementation",
    startDate: inDays(28),
    completionDate: inDays(90),
    maxBudget: 500000,
    capabilities: ["Frontend Development"],
  });
  for (const question of questions) await surface.opportunitySwuCreate.addTeamQuestion(question);
  await surface.opportunitySwuCreate.setEvaluationPanel(panel);
}

async function prepareTeamWithUs(surface: Surface, question: Record<string, unknown>): Promise<void> {
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResource({ serviceArea: "Full Stack Developer", targetAllocation: 100 });
  await surface.opportunityTwuCreate.addResourceQuestion(question);
  await surface.opportunityTwuCreate.setEvaluationPanel(panel);
}

async function refusedOnSubmissionForReview(
  surface: Surface,
  question: Record<string, unknown>,
  title: string,
  field: RegExp,
): Promise<void> {
  await surface.signIn(persona.publicSectorStaff);
  await prepareSprintWithUs(surface, [question]);
  await surface.opportunitySwuCreate.submitForReview({ ...sprintWithUsDetails, title });
  await expect.poll(() => readOrEmpty(() => surface.opportunitySwuCreate.fieldError()), settle).toMatch(field);
}

test(`${statement} (an empty question is refused on submission for review, naming the question)`, async ({ surface }) => {
  await refusedOnSubmissionForReview(surface, { ...sound, question: "" }, "R-1.17 submitted with an empty question", /question/i);
});

test(`${statement} (a question over 1,000 characters is refused on submission for review, naming the question)`, async ({
  surface,
}) => {
  await refusedOnSubmissionForReview(
    surface,
    { ...sound, question: "q".repeat(1001) },
    "R-1.17 submitted with an over-length question",
    /question/i,
  );
});

test(`${statement} (an empty guideline is refused on submission for review, naming the guideline)`, async ({ surface }) => {
  await refusedOnSubmissionForReview(
    surface,
    { ...sound, guideline: "" },
    "R-1.17 submitted with an empty guideline",
    /guideline/i,
  );
});

test(`${statement} (a guideline over 1,000 characters is refused on submission for review, naming the guideline)`, async ({
  surface,
}) => {
  await refusedOnSubmissionForReview(
    surface,
    { ...sound, guideline: "g".repeat(1001) },
    "R-1.17 submitted with an over-length guideline",
    /guideline/i,
  );
});

test(`${statement} (a maximum score below 1 is refused on submission for review, naming the score)`, async ({ surface }) => {
  await refusedOnSubmissionForReview(surface, { ...sound, score: 0 }, "R-1.17 submitted with a score below one", /score/i);
});

test(`${statement} (a response word limit below 1 is refused on submission for review, naming the word limit)`, async ({
  surface,
}) => {
  await refusedOnSubmissionForReview(
    surface,
    { ...sound, wordLimit: 0 },
    "R-1.17 submitted with a word limit below one",
    /word/i,
  );
});

test(`${statement} (a response word limit above 3,000 is refused on submission for review, naming the word limit)`, async ({
  surface,
}) => {
  await refusedOnSubmissionForReview(
    surface,
    { ...sound, wordLimit: 3001 },
    "R-1.17 submitted with a word limit above three thousand",
    /word/i,
  );
});

test(`${statement} (a Sprint With Us minimum score that is not lower than the maximum is refused on submission for review, naming the minimum score)`, async ({
  surface,
}) => {
  await refusedOnSubmissionForReview(
    surface,
    { ...sound, minimumScore: sound.score },
    "R-1.17 submitted with a minimum score equal to the maximum",
    /minimum/i,
  );
});

test(`${statement} (a Team With Us minimum score that is not lower than the maximum is refused on submission for review, naming the minimum score)`, async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await prepareTeamWithUs(surface, {
    ...sound,
    question: "Describe how your resource has delivered work of this kind before.",
    minimumScore: sound.score + 1,
  });
  await surface.opportunityTwuCreate.submitForReview({
    ...teamWithUsDetails,
    title: "R-1.17 Team With Us submitted with a minimum score above the maximum",
  });
  await expect.poll(() => readOrEmpty(() => surface.opportunityTwuCreate.fieldError()), settle).toMatch(/minimum/i);
});

test(`${statement} (a Sprint With Us question outside the limits is refused on publication, naming the offending field)`, async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await prepareSprintWithUs(surface, [{ ...sound, wordLimit: 3001 }]);
  await surface.opportunitySwuCreate.publish({
    ...sprintWithUsDetails,
    title: "R-1.17 published with a word limit above three thousand",
  });
  await expect.poll(() => readOrEmpty(() => surface.opportunitySwuCreate.fieldError()), settle).toMatch(/word/i);
});

test(`${statement} (a Team With Us question outside the limits is refused on publication, naming the offending field)`, async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await prepareTeamWithUs(surface, {
    ...sound,
    question: "Describe how your resource has delivered work of this kind before.",
    guideline: "",
  });
  await surface.opportunityTwuCreate.publish({
    ...teamWithUsDetails,
    title: "R-1.17 Team With Us published with an empty guideline",
  });
  await expect.poll(() => readOrEmpty(() => surface.opportunityTwuCreate.fieldError()), settle).toMatch(/guideline/i);
});

test(`${statement} (a question whose position would fall beyond 100 is refused on submission for review)`, async ({
  surface,
}) => {
  test.setTimeout(20 * 60 * 1000);
  await surface.signIn(persona.publicSectorStaff);
  const questions = Array.from({ length: 101 }, (_, place) => ({ ...sound, question: `R-1.17 question at position ${place}` }));
  await prepareSprintWithUs(surface, questions);

  let offered = true;
  try {
    await surface.opportunitySwuCreate.addTeamQuestion({ ...sound, question: "R-1.17 question at position 101" });
  } catch {
    offered = false;
  }
  if (!offered) return; // the form will not take a question at position 101: it is never held

  await surface.opportunitySwuCreate.submitForReview({
    ...sprintWithUsDetails,
    title: "R-1.17 submitted with a hundred and two questions",
  });
  await expect.poll(() => readOrEmpty(() => surface.opportunitySwuCreate.fieldError()), settle).toMatch(/question|position|order/i);
});

test(`${statement} (a question's position is set by its place in the list)`, async ({ surface }) => {
  const first = "R-1.17 the question added first";
  const second = "R-1.17 the question added second";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addTeamQuestion({ ...sound, question: first });
  await surface.opportunitySwuCreate.addTeamQuestion({ ...sound, question: second });
  await surface.opportunitySwuCreate.saveDraft({ title: "R-1.17 draft whose questions are listed in order" });
  await expect.poll(() => readOrEmpty(() => surface.opportunitySwuEdit.opportunityIdentifier()), settle).toBeTruthy();
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();

  await surface.opportunitySwuEdit.open({ opportunityId });
  await expect.poll(() => readOrEmpty(() => surface.opportunitySwuEdit.teamQuestionsTab()), settle).toContain(second);
  const listed = await surface.opportunitySwuEdit.teamQuestionsTab();
  expect(listed.indexOf(first)).toBeGreaterThanOrEqual(0);
  expect(listed.indexOf(first)).toBeLessThan(listed.indexOf(second));
});

test(`${statement} (a Sprint With Us draft may be saved holding a question outside these limits)`, async ({ surface }) => {
  const question = "R-1.17 an out-of-limit question kept on a Sprint With Us draft";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addTeamQuestion({
    question,
    guideline: "g".repeat(1001),
    score: 20,
    minimumScore: 20,
    wordLimit: 3001,
  });
  await surface.opportunitySwuCreate.saveDraft({ title: "R-1.17 Sprint With Us draft holding an out-of-limit question" });
  await expect.poll(() => readOrEmpty(() => surface.opportunitySwuEdit.opportunityIdentifier()), settle).toBeTruthy();
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();

  await surface.opportunitySwuEdit.open({ opportunityId });
  await expect.poll(() => readOrEmpty(() => surface.opportunitySwuEdit.teamQuestionsTab()), settle).toContain(question);
});

test(`${statement} (a Team With Us draft may be saved holding a question outside these limits)`, async ({ surface }) => {
  const question = "R-1.17 an out-of-limit question kept on a Team With Us draft";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResourceQuestion({
    question,
    guideline: "g".repeat(1001),
    score: 20,
    minimumScore: 20,
    wordLimit: 3001,
  });
  await surface.opportunityTwuCreate.saveDraft({ title: "R-1.17 Team With Us draft holding an out-of-limit question" });
  await expect.poll(() => readOrEmpty(() => surface.opportunityTwuEdit.opportunityIdentifier()), settle).toBeTruthy();
  const opportunityId = await surface.opportunityTwuEdit.opportunityIdentifier();

  await surface.opportunityTwuEdit.open({ opportunityId });
  await expect.poll(() => readOrEmpty(() => surface.opportunityTwuEdit.resourceQuestionsTab()), settle).toContain(question);
});
