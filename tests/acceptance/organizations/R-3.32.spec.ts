// criterion: @R-3.32 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("when an invited person declines the invitation the pending membership is gone from the team list and the owner is told the request was rejected", async ({
  surface,
  mail,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.addTeamMembers({ emails: [seed.users.invitedVendor.email] });
  expect(await surface.organizationEdit.teamMemberRow()).toContain(seed.users.invitedVendor.email);

  await mail.clear();

  await surface.signIn(persona.invitedVendor);
  await surface.organizationUserMemberships.open({ userId: seed.users.invitedVendor.id });
  await surface.organizationUserMemberships.rejectInvitation({
    organization: seed.organizations.qualified.legal_name,
  });

  const toOwner = await mail.messagesTo(seed.users.organizationOwner.email);
  expect(toOwner.length).toBeGreaterThan(0);

  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  expect(await surface.organizationEdit.teamMemberRow()).not.toContain(seed.users.invitedVendor.email);
});
