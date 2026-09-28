// criterion: @R-3.9 v1
// provenance: blind, spec@c1e09955fdff55e84870c25dfcb8e0fd9981c437, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is a person with a pending invitation to an organization: the seed's organization
// whose owner has invited seed.users.invitedVendor and nobody else.
const organization = seed.organizations.withPendingInvitation;

// An attempt somebody is offered no way to make has been refused; what establishes the refusal
// is the state of the membership afterwards, not whatever the attempt itself shows.
async function attempt(action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch {
    // Refused by not being offered.
  }
}

// A badge that is not on the page reads as absent.
async function pendingOnTeamList(surface: Surface): Promise<string> {
  return surface.organizationEdit.pendingBadge().catch(() => "");
}

async function pendingAmongOwnOrganizations(surface: Surface): Promise<string> {
  return surface.organizationUserMembershipsSelf.pendingBadge().catch(() => "");
}

// The invited person reads their own membership: the organization is among their affiliated
// organizations and no longer marked pending.
async function expectActiveMembership(surface: Surface): Promise<void> {
  await surface.signIn(persona.invitedVendor);
  await surface.organizationUserMembershipsSelf.open();
  await expect
    .poll(() => surface.organizationUserMembershipsSelf.affiliatedOrganizationsTable())
    .toContain(organization.legal_name);
  await expect.poll(() => pendingAmongOwnOrganizations(surface)).toBeFalsy();
}

test("nobody else can accept a pending invitation: the organization's owner's attempt to accept it on the invited person's behalf is refused", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  await attempt(() => surface.organizationEdit.approvePendingMember({ member: seed.users.invitedVendor }));

  // The membership is still pending afterwards.
  await surface.organizationEdit.open({ orgId: organization.id });
  await expect.poll(() => pendingOnTeamList(surface)).toBeTruthy();
});

test("a pending invitation becomes an active membership when the invited person accepts it", async ({ surface }) => {
  await surface.signIn(persona.invitedVendor);
  await surface.organizationUserMembershipsSelf.open();
  await surface.organizationUserMembershipsSelf.approveInvitation({ organization: organization.legal_name });

  await expectActiveMembership(surface);
});

test("a pending invitation becomes an active membership when an administrator accepts it on the invited person's behalf", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.organizationUserMemberships.open({ userId: seed.users.invitedVendor.id });
  await surface.organizationUserMemberships.approveInvitation({ organization: organization.legal_name });

  await expectActiveMembership(surface);
});

test("an invitation that is not pending cannot be accepted", async ({ surface }) => {
  // The invited person accepts, so the membership is active and no longer pending.
  await surface.signIn(persona.invitedVendor);
  await surface.organizationUserMembershipsSelf.open();
  await surface.organizationUserMembershipsSelf.approveInvitation({ organization: organization.legal_name });
  await expectActiveMembership(surface);

  // A further attempt to accept it.
  await surface.organizationUserMembershipsSelf.open();
  await attempt(() =>
    surface.organizationUserMembershipsSelf.approveInvitation({ organization: organization.legal_name }),
  );

  // The membership is unchanged: still active, still the invited person's.
  await expectActiveMembership(surface);
});
