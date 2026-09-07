// criterion: @R-3.12 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("the owner grants administrator rights to the second member and that member gains them", async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.acceptOrgAdminTerms();

  // The member's own row on the team list is what the grant has to change. It is read
  // once while they are an ordinary member so the reading after the grant is told apart
  // from it, rather than matched against a wording this criterion never states.
  const beforeGrant = await surface.organizationEdit.teamMemberRow();

  await surface.organizationEdit.toggleMemberAdminStatus({ member: seed.users.organizationMember });

  expect(await surface.organizationEdit.teamMemberRow()).not.toBe(beforeGrant);

  // Withdraw the rights again so the organization is left as the seed describes it.
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
