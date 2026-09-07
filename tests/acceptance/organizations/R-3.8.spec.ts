// criterion: @R-3.8 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("the repeat invitation is refused as the person already being a member of the organization", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.withPendingInvitation.id });
  await surface.organizationEdit.addTeamMembers({ emails: [seed.users.invitedVendor.email] });

  expect(await surface.organizationEdit.fieldError()).toBeTruthy();
});

test("the invitation to public sector staff is refused because only vendors may be invited", async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.withPendingInvitation.id });
  await surface.organizationEdit.addTeamMembers({ emails: [seed.users.staffOne.email] });

  expect(await surface.organizationEdit.fieldError()).toBeTruthy();
  expect(await surface.organizationEdit.teamMemberRow()).not.toContain(seed.users.staffOne.email);
});
