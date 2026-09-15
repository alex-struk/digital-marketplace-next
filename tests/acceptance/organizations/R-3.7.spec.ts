// criterion: @R-3.7 v1
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Persona, Surface } from "../../fixtures";

// The given is an organization with an owner and no other members: the seed's unqualified
// organization, owned by seed.users.vendorOne.
const organization = seed.organizations.unqualified;

// The criterion never says the team list shows email addresses, and the seed names no
// account's name, so each invitee writes a name on their own profile and is looked for by it.
const invitees = [
  { who: persona.fileUploader, user: seed.users.fileUploader, name: "Perpetua Wrenfield" },
  { who: persona.vendorWithNoticesOff, user: seed.users.vendorWithNoticesOff, name: "Octavian Wrenfield" },
];

// Which accounts are active is established rather than assumed. The signed-in administrator is
// active by being signed in at all, so their own status badge is what "active" reads as.
async function establishActive(surface: Surface, userId: string): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.administratorOne.id });
  const active = await surface.userProfile.statusBadge();
  await surface.userProfile.open({ userId });
  if ((await surface.userProfile.statusBadge()) !== active) {
    await surface.userProfile.reactivateAccount();
    await surface.userProfile.confirmActivationChange();
    await surface.userProfile.open({ userId });
  }
  expect(await surface.userProfile.statusBadge()).toBe(active);
}

async function nameThemselves(surface: Surface, who: Persona, name: string): Promise<void> {
  await surface.signIn(who);
  await surface.userProfileSelf.open();
  await surface.userProfileSelf.editProfile();
  await surface.userProfileSelf.saveChanges({ name });
}

test("an organization's owner may invite people to the team by email address, and each invitation is created as a pending membership that does not count towards the team until accepted", async ({
  surface,
}) => {
  await establishActive(surface, seed.users.vendorOne.id);
  for (const invitee of invitees) {
    await establishActive(surface, invitee.user.id);
    await nameThemselves(surface, invitee.who, invitee.name);
  }

  // The team size the owner is shown for the organization, read before anyone is invited so the
  // readings after are held against it; what number the page prints is its own business.
  await surface.signIn(persona.vendor);
  await surface.organizationUserMembershipsSelf.open();
  const teamSizeBefore = await surface.organizationUserMembershipsSelf.teamMemberCount();

  await surface.organizationEdit.open({ orgId: organization.id });
  expect(await surface.organizationEdit.pendingBadge()).toBeFalsy();

  await surface.organizationEdit.addTeamMembers({ emails: invitees.map((invitee) => invitee.user.email) });

  await surface.organizationEdit.open({ orgId: organization.id });
  await expect.poll(() => surface.organizationEdit.teamMemberRow()).toContain(invitees[1].name);
  const rows = await surface.organizationEdit.teamMemberRow();
  for (const invitee of invitees) {
    expect(rows).toContain(invitee.name);
  }
  expect(await surface.organizationEdit.pendingBadge()).toBeTruthy();

  // Neither pending invitation counts towards the team.
  await surface.organizationUserMembershipsSelf.open();
  expect(await surface.organizationUserMembershipsSelf.teamMemberCount()).toBe(teamSizeBefore);

  // Until they accept: once one invitee accepts, the team size moves, which also shows the
  // reading above is one that would have moved had an invitation counted.
  await surface.signIn(invitees[0].who);
  await surface.organizationUserMembershipsSelf.open();
  await surface.organizationUserMembershipsSelf.approveInvitation({ organization: organization.legal_name });

  await surface.signIn(persona.vendor);
  await surface.organizationUserMembershipsSelf.open();
  await expect.poll(() => surface.organizationUserMembershipsSelf.teamMemberCount()).not.toBe(teamSizeBefore);
});
