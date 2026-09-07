// criterion: @R-3.15 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("the organizations a vendor owns are returned, and an archived one they own is not", async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationList.open();
  await surface.organizationList.myOrganizations();

  const mine = await surface.organizationList.organizationName();
  expect(mine).toContain(seed.organizations.qualified.legal_name);
  expect(mine).toContain(seed.organizations.withPendingInvitation.legal_name);
  expect(mine).not.toContain(seed.organizations.archived.legal_name);
});

test("an organization a vendor administers is returned", async ({ surface }) => {
  await surface.signIn(persona.organizationAdmin);
  await surface.organizationList.open();
  await surface.organizationList.myOrganizations();

  expect(await surface.organizationList.organizationName()).toContain(seed.organizations.qualified.legal_name);
});

test("an organization a vendor is only an ordinary member of is not returned", async ({ surface }) => {
  await surface.signIn(persona.organizationMember);
  await surface.organizationList.open();
  await surface.organizationList.myOrganizations();

  expect(await surface.organizationList.organizationName()).not.toContain(seed.organizations.qualified.legal_name);
});
