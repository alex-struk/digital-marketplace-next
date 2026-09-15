// criterion: @R-3.3 v1
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const organization = seed.organizations.qualified;

// Which accounts are active is established rather than assumed: a deactivated member would be
// turned away for a reason that has nothing to do with this criterion, and a deactivated owner
// could not show being let in. The signed-in administrator is active by being signed in at all,
// so their own status badge is what "active" reads as.
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

// The criterion lets a service administrator in, so the member of public sector staff must hold
// no administrator rights at the moment they try. Their own statement of permissions is read;
// if it names administrator rights, an administrator withdraws them and it is read again.
async function establishStaffWithoutAdministratorRights(surface: Surface): Promise<void> {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open({ userId: seed.users.staffOne.id });
  if ((await surface.userProfile.permissionsLabel()).toLowerCase().includes("admin")) {
    await surface.signIn(persona.administrator);
    await surface.userProfile.open({ userId: seed.users.staffOne.id });
    await surface.userProfile.toggleAdminPermission();
    await surface.signIn(persona.publicSectorStaff);
    await surface.userProfile.open({ userId: seed.users.staffOne.id });
  }
  const permissions = (await surface.userProfile.permissionsLabel()).toLowerCase();
  expect(permissions).toBeTruthy();
  expect(permissions).not.toContain("admin");
}

// The criterion's own note says the ordinary member is shown a page that is not there rather
// than a refusal, so being refused is read as the organization's record not being shown.
test("an organization's full record is refused to an ordinary member of that organization and to a member of public sector staff", async ({
  surface,
}) => {
  await establishActive(surface, seed.users.organizationMember.id);
  await surface.signIn(persona.organizationMember);
  await surface.organizationEdit.open({ orgId: organization.id });
  expect(await surface.organizationEdit.organizationTab()).not.toContain(organization.legal_name);

  await establishActive(surface, seed.users.staffOne.id);
  await establishStaffWithoutAdministratorRights(surface);
  await surface.organizationEdit.open({ orgId: organization.id });
  expect(await surface.organizationEdit.organizationTab()).not.toContain(organization.legal_name);
});

test("an organization's full record can be opened by its owner, by its administrator and by a service administrator", async ({
  surface,
}) => {
  await establishActive(surface, seed.users.organizationOwner.id);
  await establishActive(surface, seed.users.organizationAdmin.id);

  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  await expect.poll(() => surface.organizationEdit.organizationTab()).toContain(organization.legal_name);

  await surface.signIn(persona.organizationAdmin);
  await surface.organizationEdit.open({ orgId: organization.id });
  await expect.poll(() => surface.organizationEdit.organizationTab()).toContain(organization.legal_name);

  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: organization.id });
  await expect.poll(() => surface.organizationEdit.organizationTab()).toContain(organization.legal_name);
});
