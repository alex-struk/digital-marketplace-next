// criterion: @R-3.9 v1
// provenance: blind, spec@8272c1b989e3bad64c78ae540830a62747dadf42, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";

// Every scenario that accepts an invitation starts from an invitation of its own that is
// still pending when it starts, so no scenario depends on what a sibling did first:
// - the invited person accepts seed.users.invitedVendor's invitation to
//   seed.organizations.withPendingInvitation;
// - the administrator accepts seed.users.teamCandidatePending's invitation to
//   seed.organizations.qualified, on that person's behalf;
// - the owner's refused attempt is made on invitedVendor's invitation and accepts nothing;
// - the not-pending scenario uses seed.users.organizationMember's membership of
//   seed.organizations.qualified, which the seed already makes active.

// An attempt somebody is not offered a way to make ends by not going through; what shows
// the refusal is the membership's state afterwards.
async function attempt(action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch {
    // Refused by not being offered.
  }
}

// A pending badge that is not on the page reads as absent.
function orAbsent(read: () => Promise<string>): () => Promise<string> {
  return () => read().catch(() => "");
}

test("nobody else can accept a pending invitation: the organization's owner's attempt to accept it on the invited person's behalf is refused", async ({
  surface,
}) => {
  const organization = seed.organizations.withPendingInvitation;

  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  await attempt(() => surface.organizationEdit.approvePendingMember({ member: seed.users.invitedVendor }));

  // The invitation is still pending afterwards, as the invited person sees it.
  await surface.signIn(persona.invitedVendor);
  await surface.organizationUserMembershipsSelf.open();
  await expect
    .poll(() => surface.organizationUserMembershipsSelf.affiliatedOrganizationsTable())
    .toContain(organization.legal_name);
  await expect.poll(orAbsent(() => surface.organizationUserMembershipsSelf.pendingBadge())).toBeTruthy();
});

test("a pending invitation becomes an active membership when the invited person accepts it", async ({ surface }) => {
  const organization = seed.organizations.withPendingInvitation;

  await surface.signIn(persona.invitedVendor);
  await surface.organizationUserMembershipsSelf.open();
  await surface.organizationUserMembershipsSelf.approveInvitation({ organization: organization.legal_name });

  await surface.organizationUserMembershipsSelf.open();
  await expect
    .poll(() => surface.organizationUserMembershipsSelf.affiliatedOrganizationsTable())
    .toContain(organization.legal_name);
  await expect.poll(orAbsent(() => surface.organizationUserMembershipsSelf.pendingBadge())).toBeFalsy();
});

test("a pending invitation becomes an active membership when an administrator accepts it on the invited person's behalf", async ({
  surface,
}) => {
  const organization = seed.organizations.qualified;
  const invited = seed.users.teamCandidatePending;

  await surface.signIn(persona.administrator);
  await surface.organizationUserMemberships.open({ userId: invited.id });
  await surface.organizationUserMemberships.approveInvitation({ organization: organization.legal_name });

  await surface.organizationUserMemberships.open({ userId: invited.id });
  await expect
    .poll(() => surface.organizationUserMemberships.affiliatedOrganizationsTable())
    .toContain(organization.legal_name);
  await expect.poll(orAbsent(() => surface.organizationUserMemberships.pendingBadge())).toBeFalsy();
});

test("an invitation that is not pending cannot be accepted", async ({ surface }) => {
  const organization = seed.organizations.qualified;

  // The member's membership of the organization is already active.
  await surface.signIn(persona.organizationMember);
  await surface.organizationUserMembershipsSelf.open();
  await expect
    .poll(() => surface.organizationUserMembershipsSelf.affiliatedOrganizationsTable())
    .toContain(organization.legal_name);

  // An attempt to accept it does not go through, and no acceptance is confirmed.
  const outcome = await surface.organizationUserMembershipsSelf
    .approveInvitation({ organization: organization.legal_name })
    .then(
      () => "accepted",
      () => "refused",
    );
  expect(outcome).toBe("refused");
  expect(await surface.organizationUserMembershipsSelf.acceptConfirmation().catch(() => "")).toBeFalsy();

  // The membership is unchanged: still the member's, still not pending.
  await surface.organizationUserMembershipsSelf.open();
  await expect
    .poll(() => surface.organizationUserMembershipsSelf.affiliatedOrganizationsTable())
    .toContain(organization.legal_name);
  await expect.poll(orAbsent(() => surface.organizationUserMembershipsSelf.pendingBadge())).toBeFalsy();
});
