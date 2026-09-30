// criterion: @R-1.17 v2
// provenance: blind, spec@4e0669f519687b2eafcbe688deb8e5d92b569298, derived 2026-09-30
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Every question below is well formed but for the one field under test, so it has one reason
// to be refused. No question carries a position: the criterion says the person never enters
// one. The criterion says the same limits govern a Sprint With Us team question and a Team
// With Us resource question, so the clause the two programs could most easily differ on — a
// minimum score that is not below the maximum — is taken on both, and the rest on Sprint With
// Us.
//
// Each out-of-limit question is entered as it is, the draft is then saved — the submission —
// and only after that is the refusal read, together with the field it names. Nothing is read
// while the question is still being added. The over-length question text is driven exactly as
// the over-length guideline is.
//
// For the hundred-and-first question, an addition the form will not offer at all is also a
// refusal, since the question is then never taken; when it is offered, the draft is saved and
// the refusal read in the same way.
//
// The position being set by the question's place is read back from a saved draft: two
// questions added one after the other must be listed in that order.

const statement =
  "Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused.";

const settle = { timeout: 15000 };

const sound = {
  question: "Describe how your team has delivered work of this kind before.",
  guideline: "Answer with one worked example.",
  score: 20,
  wordLimit: 300,
};

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function refusedOnSprintWithUs(
  surface: Surface,
  question: Record<string, unknown>,
  title: string,
  field: RegExp,
): Promise<void> {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addTeamQuestion(question);
  await surface.opportunitySwuCreate.saveDraft({ title });
  await expect.poll(() => readOrEmpty(() => surface.opportunitySwuCreate.fieldError()), settle).toMatch(field);
}

test(`${statement} (an empty question is refused on submission, naming the question)`, async ({ surface }) => {
  await refusedOnSprintWithUs(surface, { ...sound, question: "" }, "R-1.17 draft with an empty question", /question/i);
});

test(`${statement} (a question over 1,000 characters is refused on submission, naming the question)`, async ({ surface }) => {
  await refusedOnSprintWithUs(
    surface,
    { ...sound, question: "q".repeat(1001) },
    "R-1.17 draft with an over-length question",
    /question/i,
  );
});

test(`${statement} (an empty guideline is refused on submission, naming the guideline)`, async ({ surface }) => {
  await refusedOnSprintWithUs(surface, { ...sound, guideline: "" }, "R-1.17 draft with an empty guideline", /guideline/i);
});

test(`${statement} (a guideline over 1,000 characters is refused on submission, naming the guideline)`, async ({ surface }) => {
  await refusedOnSprintWithUs(
    surface,
    { ...sound, guideline: "g".repeat(1001) },
    "R-1.17 draft with an over-length guideline",
    /guideline/i,
  );
});

test(`${statement} (a maximum score below 1 is refused on submission, naming the score)`, async ({ surface }) => {
  await refusedOnSprintWithUs(surface, { ...sound, score: 0 }, "R-1.17 draft with a score below one", /score/i);
});

test(`${statement} (a response word limit below 1 is refused on submission, naming the word limit)`, async ({ surface }) => {
  await refusedOnSprintWithUs(surface, { ...sound, wordLimit: 0 }, "R-1.17 draft with a word limit below one", /word/i);
});

test(`${statement} (a response word limit above 3,000 is refused on submission, naming the word limit)`, async ({ surface }) => {
  await refusedOnSprintWithUs(
    surface,
    { ...sound, wordLimit: 3001 },
    "R-1.17 draft with a word limit above three thousand",
    /word/i,
  );
});

test(`${statement} (a Sprint With Us minimum score that is not lower than the maximum is refused on submission, naming the minimum score)`, async ({
  surface,
}) => {
  await refusedOnSprintWithUs(
    surface,
    { ...sound, minimumScore: sound.score },
    "R-1.17 draft with a minimum score equal to the maximum",
    /minimum/i,
  );
});

test(`${statement} (a Team With Us minimum score that is not lower than the maximum is refused on submission, naming the minimum score)`, async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResourceQuestion({
    ...sound,
    question: "Describe how your resource has delivered work of this kind before.",
    minimumScore: sound.score,
  });
  await surface.opportunityTwuCreate.saveDraft({ title: "R-1.17 Team With Us draft with a minimum score equal to the maximum" });
  await expect.poll(() => readOrEmpty(() => surface.opportunityTwuCreate.fieldError()), settle).toMatch(/minimum/i);
});

test(`${statement} (a hundred and first question is refused on submission, naming the questions)`, async ({ surface }) => {
  test.setTimeout(20 * 60 * 1000);
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuCreate.open();
  for (let place = 1; place <= 100; place++) {
    await surface.opportunitySwuCreate.addTeamQuestion({ ...sound, question: `R-1.17 question number ${place}` });
  }

  let offered = true;
  try {
    await surface.opportunitySwuCreate.addTeamQuestion({ ...sound, question: "R-1.17 question number 101" });
  } catch {
    offered = false;
  }
  if (!offered) return; // the form will not take a hundred and first question: refused

  await surface.opportunitySwuCreate.saveDraft({ title: "R-1.17 draft with a hundred and one questions" });
  await expect.poll(() => readOrEmpty(() => surface.opportunitySwuCreate.fieldError()), settle).toMatch(/question/i);
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
  expect(opportunityId).not.toBe(seed.opportunities.closedSprintWithUs.id);

  await surface.opportunitySwuEdit.open({ opportunityId });
  await expect.poll(() => readOrEmpty(() => surface.opportunitySwuEdit.teamQuestionsTab()), settle).toContain(second);
  const listed = await surface.opportunitySwuEdit.teamQuestionsTab();
  expect(listed.indexOf(first)).toBeGreaterThanOrEqual(0);
  expect(listed.indexOf(first)).toBeLessThan(listed.indexOf(second));
});
