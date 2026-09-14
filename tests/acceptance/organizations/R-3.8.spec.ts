// criterion: @R-3.8 v1
// provenance: blind, spec@1c3743e9fb53c29de89a28045222abab29c5e27e, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// The seeded organization carrying one pending invitation, outstanding for the invited
// vendor, is the criterion's given.
const organization = seed.organizations.withPendingInvitation;

test("when the owner invites the same person again, the repeat invitation is refused as the person already being a member of the organization", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  const teamBefore = await surface.organizationEdit.teamMemberRow();
  expect(teamBefore).toContain(seed.users.invitedVendor.email);

  await surface.organizationEdit.addTeamMembers({ emails: [seed.users.invitedVendor.email] });

  expect(await surface.organizationEdit.fieldError()).toMatch(/member/i);
  expect(await surface.organizationEdit.teamMemberRow()).toBe(teamBefore);
});

test("when the owner invites a member of public sector staff, the invitation is refused because only vendors may be invited", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  const teamBefore = await surface.organizationEdit.teamMemberRow();

  await surface.organizationEdit.addTeamMembers({ emails: [seed.users.staffOne.email] });

  expect(await surface.organizationEdit.fieldError()).toMatch(/vendor/i);
  const teamAfter = await surface.organizationEdit.teamMemberRow();
  expect(teamAfter).not.toContain(seed.users.staffOne.email);
  expect(teamAfter).toBe(teamBefore);
});
