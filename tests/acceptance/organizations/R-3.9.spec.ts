// criterion: @R-3.9 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("the organization owner's attempt to accept a pending invitation on the invited person's behalf is refused", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.withPendingInvitation.id });
  await surface.organizationEdit.approvePendingMember({ member: seed.users.invitedVendor });

  expect(await surface.organizationEdit.fieldError()).toBeTruthy();
  expect(await surface.organizationEdit.pendingBadge()).toBeTruthy();
});

test("the invited person's own acceptance makes the membership active", async ({ surface }) => {
  await surface.signIn(persona.invitedVendor);
  await surface.organizationUserMemberships.open({ userId: seed.users.invitedVendor.id });
  await surface.organizationUserMemberships.approveInvitation({
    organization: seed.organizations.withPendingInvitation.legal_name,
  });

  expect(await surface.organizationUserMemberships.affiliatedOrganizationsTable()).toContain(
    seed.organizations.withPendingInvitation.legal_name,
  );
  expect(await surface.organizationUserMemberships.pendingBadge()).toBeFalsy();
});

test("a further attempt to accept the now-active membership is refused as not pending", async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.withPendingInvitation.id });
  await surface.organizationEdit.approvePendingMember({ member: seed.users.invitedVendor });

  expect(await surface.organizationEdit.fieldError()).toBeTruthy();
});
