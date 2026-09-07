// criterion: @R-3.14 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("the ordinary member asking for the organization's team list is refused", async ({ surface }) => {
  await surface.signIn(persona.organizationMember);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });

  expect(await surface.organizationEdit.teamMemberRow()).toBeFalsy();
});

test("a vendor unconnected to the organization asking for its team list is refused", async ({ surface }) => {
  await surface.signIn(persona.vendor);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });

  expect(await surface.organizationEdit.teamMemberRow()).toBeFalsy();
});

test("the owner receives the organization's team list", async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });

  expect(await surface.organizationEdit.teamMemberRow()).toBeTruthy();
});

test("a service administrator receives the organization's team list", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });

  expect(await surface.organizationEdit.teamMemberRow()).toBeTruthy();
});
