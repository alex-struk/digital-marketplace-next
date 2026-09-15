// criterion: @R-3.13 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The seed's organization with a pending invitation already holds an owner
// (seed.users.organizationOwner) and a member whose invitation is still pending
// (seed.users.invitedVendor). The given also needs one active member, so the owner invites
// seed.users.organizationMember and that member accepts from their own list of organizations.
// The target is put back to the seed before every test, so the transfer never outlives it.
const organization = seed.organizations.withPendingInvitation;

async function withOneActiveMember(surface: Surface): Promise<void> {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  await surface.organizationEdit.addTeamMembers({ emails: [seed.users.organizationMember.email] });

  await surface.signIn(persona.organizationMember);
  await surface.organizationUserMembershipsSelf.open();
  await surface.organizationUserMembershipsSelf.approveInvitation({ organization: organization.legal_name });
  await expect
    .poll(() => surface.organizationUserMembershipsSelf.affiliatedOrganizationsTable())
    .toContain(organization.legal_name);
}

// The criterion promises that a transfer is refused, not a message. An attempt the page does
// not let through is that refusal, so it is not itself a failure; what is asserted is that
// ownership did not move.
async function attempt(action: Promise<void>): Promise<void> {
  await action.catch(() => undefined);
}

async function stillOwnedByItsOwner(surface: Surface): Promise<void> {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationUserMembershipsSelf.open();
  await expect.poll(() => surface.organizationUserMembershipsSelf.ownedOrganizationsTable()).toContain(organization.legal_name);
}

test("a service administrator may transfer ownership of an organization to a member whose membership is already active", async ({
  surface,
}) => {
  await withOneActiveMember(surface);

  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: organization.id });
  await surface.organizationEdit.changeOwner({ newOwner: seed.users.organizationMember });

  await surface.signIn(persona.organizationMember);
  await surface.organizationUserMembershipsSelf.open();
  await expect.poll(() => surface.organizationUserMembershipsSelf.ownedOrganizationsTable()).toContain(organization.legal_name);
});

test("once ownership is transferred the previous owner becomes an ordinary member", async ({ surface }) => {
  await withOneActiveMember(surface);

  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: organization.id });
  await surface.organizationEdit.changeOwner({ newOwner: seed.users.organizationMember });

  await surface.signIn(persona.organizationOwner);
  await surface.organizationUserMembershipsSelf.open();
  await expect
    .poll(() => surface.organizationUserMembershipsSelf.affiliatedOrganizationsTable())
    .toContain(organization.legal_name);
  expect(await surface.organizationUserMembershipsSelf.ownedOrganizationsTable()).not.toContain(organization.legal_name);

  // The affiliated table does not tell an administrator from an ordinary member. What does is
  // the organization's management page, which an ordinary member is refused (R-3.3).
  await surface.organizationEdit.open({ orgId: organization.id });
  expect(await surface.organizationEdit.organizationTab()).not.toContain(organization.legal_name);
});

test("ownership of an organization cannot be transferred to a member whose invitation is still pending", async ({ surface }) => {
  await withOneActiveMember(surface);

  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: organization.id });
  await attempt(surface.organizationEdit.changeOwner({ newOwner: seed.users.invitedVendor }));

  await stillOwnedByItsOwner(surface);
  await surface.signIn(persona.invitedVendor);
  await surface.organizationUserMembershipsSelf.open();
  expect(await surface.organizationUserMembershipsSelf.ownedOrganizationsTable()).not.toContain(organization.legal_name);
});

test("only a service administrator may transfer ownership of an organization, not the organization's own owner", async ({
  surface,
}) => {
  await withOneActiveMember(surface);

  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  await attempt(surface.organizationEdit.changeOwner({ newOwner: seed.users.organizationMember }));

  await stillOwnedByItsOwner(surface);
  await surface.signIn(persona.organizationMember);
  await surface.organizationUserMembershipsSelf.open();
  expect(await surface.organizationUserMembershipsSelf.ownedOrganizationsTable()).not.toContain(organization.legal_name);
});
