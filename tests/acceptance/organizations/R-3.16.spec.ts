// criterion: @R-3.16 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("a signed-in member of public sector staff receives an empty list of organizations they may act on behalf of", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.organizationList.open();
  await surface.organizationList.myOrganizations();

  const mine = await surface.organizationList.organizationName();
  expect(mine).not.toContain(seed.organizations.qualified.legal_name);
  expect(mine).not.toContain(seed.organizations.unqualified.legal_name);
});

test("a visitor who is not signed in receives an empty list of organizations they may act on behalf of", async ({
  surface,
}) => {
  await surface.organizationList.open();
  await surface.organizationList.myOrganizations();

  const mine = await surface.organizationList.organizationName();
  expect(mine).not.toContain(seed.organizations.qualified.legal_name);
  expect(mine).not.toContain(seed.organizations.unqualified.legal_name);
});
