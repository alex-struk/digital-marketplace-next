// criterion: @R-3.32 v1
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Persona, Surface } from "../../fixtures";

// The given is a person with a pending invitation to an organization: the seed's organization
// whose owner has invited seed.users.invitedVendor.
const organization = seed.organizations.withPendingInvitation;

// The criterion never says the team list shows email addresses, and the seed names no account's
// name, so the invited person writes a name on their own profile and is looked for by it.
const invitedName = "Rosalind Fenwhistle";

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

test("when an invited person declines an invitation rather than accepting it, the pending membership is gone from the team list and the organization's owner is told the request was rejected", async ({
  surface,
  mail,
}) => {
  await establishActive(surface, seed.users.organizationOwner.id);
  await establishActive(surface, seed.users.invitedVendor.id);
  await nameThemselves(surface, persona.invitedVendor, invitedName);

  // Before: the invited person is on the team list, pending.
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  await expect.poll(() => surface.organizationEdit.teamMemberRow()).toContain(invitedName);
  expect(await surface.organizationEdit.pendingBadge()).toBeTruthy();

  await mail.clear();

  await surface.signIn(persona.invitedVendor);
  await surface.organizationUserMembershipsSelf.open();
  await surface.organizationUserMembershipsSelf.rejectInvitation({ organization: organization.legal_name });

  // The owner receives a message saying the person rejected the team request.
  await expect
    .poll(async () => (await mail.messagesTo(seed.users.organizationOwner.email)).length, { timeout: 30_000 })
    .toBeGreaterThan(0);
  const toOwner = await mail.messagesTo(seed.users.organizationOwner.email);
  expect(toOwner.map((message) => `${message.Subject}\n${message.Snippet}`).join("\n").toLowerCase()).toContain(
    "reject",
  );

  // After: the pending membership is gone from the team list.
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  await expect.poll(() => surface.organizationEdit.teamMemberRow()).not.toContain(invitedName);
});
