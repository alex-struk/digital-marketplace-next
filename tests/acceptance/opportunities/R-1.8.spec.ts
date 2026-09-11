// criterion: @R-1.8 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona } from "../../fixtures";

// Each program has a field of its own that the other two do not name — a reward for Code
// With Us, a total maximum budget for Sprint With Us, a maximum budget for Team With Us —
// so an opportunity being filed under one program is read as its own program's screen
// answering for it and the other two programs' screens answering for nothing.
//
// That the program is never changed afterwards is not asserted: no action in the surface
// offers a program on an opportunity that already exists, so there is no request to be
// refused.

test("an opportunity created under Code With Us is filed under that program alone", async ({
  surface,
}) => {
  const title = "R-1.8 opportunity created under Code With Us";

  await surface.signIn(persona.administrator);
  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseCodeWithUs();
  await surface.opportunityCwuCreate.saveDraft({ title, reward: 5000 });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();

  await surface.opportunityCwuView.open({ opportunityId });
  expect(await surface.opportunityCwuView.reward()).toBeTruthy();

  await surface.opportunitySwuView.open({ opportunityId });
  expect(await surface.opportunitySwuView.totalMaxBudget()).toBeFalsy();
  await surface.opportunityTwuView.open({ opportunityId });
  expect(await surface.opportunityTwuView.maxBudget()).toBeFalsy();
});

test("an opportunity created under Sprint With Us is filed under that program alone", async ({
  surface,
}) => {
  const title = "R-1.8 opportunity created under Sprint With Us";

  await surface.signIn(persona.administrator);
  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseSprintWithUs();
  await surface.opportunitySwuCreate.saveDraft({ title, totalMaxBudget: 500000 });
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();

  await surface.opportunitySwuView.open({ opportunityId });
  expect(await surface.opportunitySwuView.totalMaxBudget()).toBeTruthy();

  await surface.opportunityCwuView.open({ opportunityId });
  expect(await surface.opportunityCwuView.reward()).toBeFalsy();
  await surface.opportunityTwuView.open({ opportunityId });
  expect(await surface.opportunityTwuView.maxBudget()).toBeFalsy();
});

test("an opportunity created under Team With Us is filed under that program alone", async ({
  surface,
}) => {
  const title = "R-1.8 opportunity created under Team With Us";

  await surface.signIn(persona.administrator);
  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseTeamWithUs();
  await surface.opportunityTwuCreate.saveDraft({ title, maxBudget: 300000 });
  const opportunityId = await surface.opportunityTwuEdit.opportunityIdentifier();

  await surface.opportunityTwuView.open({ opportunityId });
  expect(await surface.opportunityTwuView.maxBudget()).toBeTruthy();

  await surface.opportunityCwuView.open({ opportunityId });
  expect(await surface.opportunityCwuView.reward()).toBeFalsy();
  await surface.opportunitySwuView.open({ opportunityId });
  expect(await surface.opportunitySwuView.totalMaxBudget()).toBeFalsy();
});
