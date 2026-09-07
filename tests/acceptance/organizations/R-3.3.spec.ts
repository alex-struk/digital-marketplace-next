// criterion: @R-3.3 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("the ordinary member is refused the organization's full record", async ({ surface }) => {
  await surface.signIn(persona.organizationMember);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });

  expect(await surface.organizationEdit.organizationTab()).not.toContain(seed.organizations.qualified.legal_name);
});

test("a member of public sector staff is refused the organization's full record", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });

  expect(await surface.organizationEdit.organizationTab()).not.toContain(seed.organizations.qualified.legal_name);
});

test("the owner sees the organization", async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });

  expect(await surface.organizationEdit.organizationTab()).toContain(seed.organizations.qualified.legal_name);
});

test("the organization's administrator sees the organization", async ({ surface }) => {
  await surface.signIn(persona.organizationAdmin);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });

  expect(await surface.organizationEdit.organizationTab()).toContain(seed.organizations.qualified.legal_name);
});

test("a service administrator sees the organization", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });

  expect(await surface.organizationEdit.organizationTab()).toContain(seed.organizations.qualified.legal_name);
});
