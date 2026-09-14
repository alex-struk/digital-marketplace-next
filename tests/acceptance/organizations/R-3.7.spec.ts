// criterion: @R-3.7 v1
// provenance: blind, spec@1c3743e9fb53c29de89a28045222abab29c5e27e, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// The seeded unqualified organization is the criterion's given: an owner and no other
// members. Its owner is the vendor persona, and it is the only organization that vendor owns.
const organization = seed.organizations.unqualified;
const invitees = [seed.users.fileUploader.email, seed.users.vendorWithNoticesOff.email];

test("when the owner invites two email addresses at once from the team page, both people appear on the team list marked as pending, and neither counts towards the organization's team size until they accept", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);

  // The owner's own memberships page carries the team size of each organization they own.
  // Read before anybody is invited, so the reading afterwards is held against it; what
  // number the page prints, and how it words it, is its own business.
  await surface.organizationUserMembershipsSelf.open();
  const teamSizeBefore = await surface.organizationUserMembershipsSelf.teamMemberCount();

  await surface.organizationEdit.open({ orgId: organization.id });
  expect(await surface.organizationEdit.pendingBadge()).toBeFalsy();

  await surface.organizationEdit.addTeamMembers({ emails: invitees });

  const rows = await surface.organizationEdit.teamMemberRow();
  expect(rows).toContain(invitees[0]);
  expect(rows).toContain(invitees[1]);
  expect(await surface.organizationEdit.pendingBadge()).toBeTruthy();

  await surface.organizationUserMembershipsSelf.open();
  expect(await surface.organizationUserMembershipsSelf.teamMemberCount()).toBe(teamSizeBefore);
});
