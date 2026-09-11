// criterion: @R-1.29 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";

// The seeded published opportunity was created by a member of public sector staff, so the
// person who created it and the administrator are two different people and the criterion's
// three readers are all available on one record.
//
// The seed carries no display name for anybody, so the assertion is that the names are
// there for the two readers entitled to them and absent for everybody else, which is what
// the criterion's "then" says and all a name that cannot be quoted could support.

const opportunityId = seed.opportunities.publishedCodeWithUs.id;

test("the names of the people who created and last changed an opportunity are shown to an administrator", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuView.open({ opportunityId });
  expect(await surface.opportunityCwuView.createdByName()).toBeTruthy();
  expect(await surface.opportunityCwuView.lastChangedByName()).toBeTruthy();
});

test("the names of the people who created and last changed an opportunity are shown to those people themselves", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuView.open({ opportunityId });
  expect(await surface.opportunityCwuView.createdByName()).toBeTruthy();
  expect(await surface.opportunityCwuView.lastChangedByName()).toBeTruthy();
});

test("those names are shown to nobody else", async ({ surface }) => {
  await surface.opportunityCwuView.open({ opportunityId });
  expect(await surface.opportunityCwuView.createdByName()).toBeFalsy();
  expect(await surface.opportunityCwuView.lastChangedByName()).toBeFalsy();

  await surface.signIn(persona.vendor);
  await surface.opportunityCwuView.open({ opportunityId });
  expect(await surface.opportunityCwuView.createdByName()).toBeFalsy();
  expect(await surface.opportunityCwuView.lastChangedByName()).toBeFalsy();
});
