// criterion: @R-1.17 v2
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Every question below is well formed but for the one field under test, so it has one reason
// to be refused. No question carries a position: the criterion says the person never enters
// one. The criterion says the same limits govern a Sprint With Us team question and a Team
// With Us resource question, so the clause the two programs could most easily differ on — a
// minimum score that is not below the maximum — is taken on both and the rest on Sprint With
// Us.
//
// A refusal is read as the form naming a fault, waited for rather than read the instant the
// value is entered. For the hundred-and-first question, an addition the form will not offer
// at all is also a refusal, since the action fails rather than waits.
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

async function refusedOnSprintWithUs(surface: Surface, question: Record<string, unknown>): Promise<void> {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addTeamQuestion(question);
  await expect.poll(() => surface.opportunitySwuCreate.fieldError(), settle).toBeTruthy();
}

test(`${statement} (a question over 1,000 characters is refused)`, async ({ surface }) => {
  await refusedOnSprintWithUs(surface, { ...sound, question: "q".repeat(1001) });
});

test(`${statement} (a guideline over 1,000 characters is refused)`, async ({ surface }) => {
  await refusedOnSprintWithUs(surface, { ...sound, guideline: "g".repeat(1001) });
});

test(`${statement} (a maximum score below 1 is refused)`, async ({ surface }) => {
  await refusedOnSprintWithUs(surface, { ...sound, score: 0 });
});

test(`${statement} (a response word limit above 3,000 is refused)`, async ({ surface }) => {
  await refusedOnSprintWithUs(surface, { ...sound, wordLimit: 3001 });
});

test(`${statement} (a Sprint With Us minimum score that is not lower than the maximum is refused)`, async ({ surface }) => {
  await refusedOnSprintWithUs(surface, { ...sound, minimumScore: sound.score });
});

test(`${statement} (a Team With Us minimum score that is not lower than the maximum is refused)`, async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResourceQuestion({
    ...sound,
    question: "Describe how your resource has delivered work of this kind before.",
    minimumScore: sound.score,
  });
  await expect.poll(() => surface.opportunityTwuCreate.fieldError(), settle).toBeTruthy();
});

test(`${statement} (a hundred and first question is refused)`, async ({ surface }) => {
  test.setTimeout(20 * 60 * 1000);
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuCreate.open();
  for (let place = 1; place <= 100; place++) {
    await surface.opportunitySwuCreate.addTeamQuestion({ ...sound, question: `R-1.17 question number ${place}` });
  }
  expect(await surface.opportunitySwuCreate.fieldError().catch(() => "")).toBeFalsy();

  let offered = true;
  try {
    await surface.opportunitySwuCreate.addTeamQuestion({ ...sound, question: "R-1.17 question number 101" });
  } catch {
    offered = false;
  }
  if (offered) await expect.poll(() => surface.opportunitySwuCreate.fieldError(), settle).toBeTruthy();
});

test(`${statement} (a question's position is set by its place in the list)`, async ({ surface }) => {
  const first = "R-1.17 the question added first";
  const second = "R-1.17 the question added second";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addTeamQuestion({ ...sound, question: first });
  await surface.opportunitySwuCreate.addTeamQuestion({ ...sound, question: second });
  await surface.opportunitySwuCreate.saveDraft({ title: "R-1.17 draft whose questions are listed in order" });
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();
  expect(opportunityId).toBeTruthy();
  expect(opportunityId).not.toBe(seed.opportunities.closedSprintWithUs.id);

  await surface.opportunitySwuEdit.open({ opportunityId });
  await expect.poll(() => surface.opportunitySwuEdit.teamQuestionsTab(), settle).toContain(second);
  const listed = await surface.opportunitySwuEdit.teamQuestionsTab();
  expect(listed.indexOf(first)).toBeGreaterThanOrEqual(0);
  expect(listed.indexOf(first)).toBeLessThan(listed.indexOf(second));
});
