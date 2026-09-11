// criterion: @R-1.17 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona } from "../../fixtures";

// Every question below is well formed but for the one field under test, so the fault the
// form reports can only be that field's. The criterion says the same limits govern a
// Sprint With Us team question and a Team With Us resource question, so the clause the two
// programs could most easily differ on — a minimum score that is not below the maximum —
// is taken on both and the rest on Sprint With Us.

const sound = {
  question: "Describe how your team has delivered work of this kind before.",
  guideline: "Answer with one worked example.",
  score: 20,
  wordLimit: 300,
  order: 0,
};

test("an evaluation question whose question runs over one thousand characters is rejected", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addTeamQuestion({ ...sound, question: "q".repeat(1001) });
  expect(await surface.opportunitySwuCreate.fieldError()).toBeTruthy();
});

test("an evaluation question whose guideline runs over one thousand characters is rejected", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addTeamQuestion({ ...sound, guideline: "g".repeat(1001) });
  expect(await surface.opportunitySwuCreate.fieldError()).toBeTruthy();
});

test("an evaluation question whose maximum score is below one is rejected", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addTeamQuestion({ ...sound, score: 0 });
  expect(await surface.opportunitySwuCreate.fieldError()).toBeTruthy();
});

test("an evaluation question whose response word limit falls outside one to three thousand is rejected", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addTeamQuestion({ ...sound, wordLimit: 3001 });
  expect(await surface.opportunitySwuCreate.fieldError()).toBeTruthy();
});

test("an evaluation question whose position falls outside nought to one hundred is rejected", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addTeamQuestion({ ...sound, order: 101 });
  expect(await surface.opportunitySwuCreate.fieldError()).toBeTruthy();
});

test("a Sprint With Us evaluation question whose minimum score is not lower than its maximum is rejected", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addTeamQuestion({ ...sound, minimumScore: 20 });
  expect(await surface.opportunitySwuCreate.fieldError()).toBeTruthy();
});

test("a Team With Us evaluation question whose minimum score is not lower than its maximum is rejected", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResourceQuestion({
    ...sound,
    question: "Describe how your resource has delivered work of this kind before.",
    minimumScore: 20,
  });
  expect(await surface.opportunityTwuCreate.fieldError()).toBeTruthy();
});
