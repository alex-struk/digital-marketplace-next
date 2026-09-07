// criterion: @R-1.7 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// Creation begins at the program chooser, so the refusal is read there: a requester who
// may not create an opportunity is offered no program to create one under, and no
// opportunity of their own on the dashboard. That the two permitted personas do reach
// the chooser is asserted by R-1.48, which uses it in earnest.

test("a vendor attempting to create an opportunity is refused and no opportunity is created", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);

  await surface.opportunityProgramSelect.open();
  expect(await surface.opportunityProgramSelect.programCard()).toBeFalsy();

  await surface.opportunityDashboard.open();
  expect(await surface.opportunityDashboard.myOpportunitiesTable()).toBeFalsy();
});

test("an anonymous visitor attempting to create an opportunity is refused and no opportunity is created", async ({
  surface,
}) => {
  await surface.opportunityProgramSelect.open();
  expect(await surface.opportunityProgramSelect.programCard()).toBeFalsy();

  await surface.opportunityDashboard.open();
  expect(await surface.opportunityDashboard.myOpportunitiesTable()).toBeFalsy();
});
