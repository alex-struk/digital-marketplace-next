// criterion: @R-3.12 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("the owner grants administrator rights to the second member and that member gains them", async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.acceptOrgAdminTerms();
  await surface.organizationEdit.toggleMemberAdminStatus({ member: seed.users.organizationMember });

  // Administrator rights over an organization are what let a member open its full
  // record, so the member opening it is the observation that the rights were granted.
  await surface.signIn(persona.organizationMember);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  expect(await surface.organizationEdit.organizationTab()).toContain(seed.organizations.qualified.legal_name);

  // Withdraw the rights again so the organization is left as the seed describes it.
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.toggleMemberAdminStatus({ member: seed.users.organizationMember });
});

test("an organization administrator trying to withdraw their own rights is refused", async ({ surface }) => {
  await surface.signIn(persona.organizationAdmin);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.toggleMemberAdminStatus({ member: seed.users.organizationAdmin });

  expect(await surface.organizationEdit.fieldError()).toBeTruthy();
});

test("a change to the owner's own membership is refused", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.toggleMemberAdminStatus({ member: seed.users.organizationOwner });

  expect(await surface.organizationEdit.fieldError()).toBeTruthy();
  expect(await surface.organizationEdit.ownerBadge()).toBeTruthy();
});
