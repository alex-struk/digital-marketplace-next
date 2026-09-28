// criterion: @R-1.29 v2
// provenance: blind, spec@c1e09955fdff55e84870c25dfcb8e0fd9981c437, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";

// The seeded published Code With Us opportunity was created by a member of public sector
// staff, so a visitor who is not signed in and a vendor are both neither an administrator
// nor one of the people who created or last changed it. The criterion says only what those
// readers are not shown, so the test asserts nothing about what anybody else is shown.

const opportunityId = seed.opportunities.publishedCodeWithUs.id;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

test("The names of the people who created and last changed an opportunity are withheld from anyone who is neither an administrator nor one of those people.", async ({
  surface,
}) => {
  const view = surface.opportunityCwuView;

  await view.open({ opportunityId });
  expect(await readOrEmpty(() => view.opportunityIdentifier())).toBeTruthy();
  expect(await readOrEmpty(() => view.createdByName())).toBeFalsy();
  expect(await readOrEmpty(() => view.lastChangedByName())).toBeFalsy();

  await surface.signIn(persona.vendor);
  await view.open({ opportunityId });
  expect(await readOrEmpty(() => view.opportunityIdentifier())).toBeTruthy();
  expect(await readOrEmpty(() => view.createdByName())).toBeFalsy();
  expect(await readOrEmpty(() => view.lastChangedByName())).toBeFalsy();
});
