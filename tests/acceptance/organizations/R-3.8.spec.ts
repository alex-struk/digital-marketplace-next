// criterion: @R-3.8 v1
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Persona, Surface } from "../../fixtures";

// The given is an organization with one pending invitation outstanding for a given person: the
// seed's organization whose owner has invited seed.users.invitedVendor.
const organization = seed.organizations.withPendingInvitation;

// organization-edit names no observation of an invitation being refused, or of why, so the
// refusal is read as the invitation not being created: no second membership for the person
// already invited, and no membership at all for the member of staff. The team list is read by
// names each person writes on their own profile, since the criterion never says it shows email
// addresses.
const invitedName = "Isolde Brackwater";
const staffName = "Cassius Brackwater";

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

// The owner and the already-invited person are active vendors, so a refusal can only be about
// the invitation itself.
async function openTeamWithInvitedPersonNamed(surface: Surface): Promise<void> {
  await establishActive(surface, seed.users.organizationOwner.id);
  await establishActive(surface, seed.users.invitedVendor.id);
  await nameThemselves(surface, persona.invitedVendor, invitedName);

  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  await expect.poll(() => surface.organizationEdit.teamMemberRow()).toContain(invitedName);
}

function occurrences(text: string, part: string): number {
  return text.split(part).length - 1;
}

test("a person cannot be invited twice to the same organization: the repeat invitation is refused as the person already being a member of the organization", async ({
  surface,
}) => {
  await openTeamWithInvitedPersonNamed(surface);
  expect(occurrences(await surface.organizationEdit.teamMemberRow(), invitedName)).toBe(1);
  expect(await surface.organizationEdit.pendingBadge()).toBeTruthy();

  await surface.organizationEdit.addTeamMembers({ emails: [seed.users.invitedVendor.email] });

  await surface.organizationEdit.open({ orgId: organization.id });
  await expect.poll(() => surface.organizationEdit.teamMemberRow()).toContain(invitedName);
  expect(occurrences(await surface.organizationEdit.teamMemberRow(), invitedName)).toBe(1);
  expect(await surface.organizationEdit.pendingBadge()).toBeTruthy();
});

test("a person may only be invited to an organization if they hold an active vendor account: the invitation to public sector staff is refused because only vendors may be invited", async ({
  surface,
}) => {
  // The member of staff is active, so the refusal can only be about their not being a vendor.
  await establishActive(surface, seed.users.staffOne.id);
  await nameThemselves(surface, persona.publicSectorStaff, staffName);

  // The invited person's name being found on the same list shows the list does show names, so
  // the staff member's name being absent is the membership being absent.
  await openTeamWithInvitedPersonNamed(surface);
  expect(await surface.organizationEdit.teamMemberRow()).not.toContain(staffName);

  await surface.organizationEdit.addTeamMembers({ emails: [seed.users.staffOne.email] });

  await surface.organizationEdit.open({ orgId: organization.id });
  await expect.poll(() => surface.organizationEdit.teamMemberRow()).toContain(invitedName);
  expect(await surface.organizationEdit.teamMemberRow()).not.toContain(staffName);
});
