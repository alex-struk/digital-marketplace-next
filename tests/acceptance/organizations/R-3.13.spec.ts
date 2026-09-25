// criterion: @R-3.13 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Persona, Surface } from "../../fixtures";

// The given is the seed's qualified organization, which already holds an owner
// (seed.users.organizationOwner) and an active member (seed.users.organizationMember), so the
// transfer needs no invitation to be answered first. The member whose invitation is still
// pending is made by the owner inviting seed.users.invitedVendor, which leaves that invitation
// unanswered. The target is put back to the seed before every test.
const organization = seed.organizations.qualified;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

// The criterion promises that a transfer is refused, not a message. A choice that is not
// offered, or is offered and cannot be taken, is that refusal, so an attempt the page does not
// let through is not itself a failure; what is asserted is that ownership did not move.
async function attempt(action: () => Promise<void>): Promise<void> {
  await action().catch(() => undefined);
}

async function ownedBy(surface: Surface, who: Persona): Promise<string> {
  await surface.signIn(who);
  await surface.organizationUserMembershipsSelf.open();
  return readOrEmpty(() => surface.organizationUserMembershipsSelf.ownedOrganizationsTable());
}

async function stillOwnedByItsOwner(surface: Surface): Promise<void> {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationUserMembershipsSelf.open();
  await expect
    .poll(() => readOrEmpty(() => surface.organizationUserMembershipsSelf.ownedOrganizationsTable()), {
      message: "ownership moved away from the organization's owner",
    })
    .toContain(organization.legal_name);
}

async function administratorTransfersToActiveMember(surface: Surface): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: organization.id });
  await surface.organizationEdit.changeOwner({ newOwner: seed.users.organizationMember });
}

test("a service administrator may transfer ownership of an organization to a member whose membership is already active", async ({
  surface,
}) => {
  await administratorTransfersToActiveMember(surface);

  await surface.signIn(persona.organizationMember);
  await surface.organizationUserMembershipsSelf.open();
  await expect
    .poll(() => readOrEmpty(() => surface.organizationUserMembershipsSelf.ownedOrganizationsTable()))
    .toContain(organization.legal_name);
});

test("once ownership is transferred the previous owner becomes an ordinary member", async ({ surface }) => {
  await administratorTransfersToActiveMember(surface);

  await surface.signIn(persona.organizationOwner);
  await surface.organizationUserMembershipsSelf.open();
  await expect
    .poll(() => readOrEmpty(() => surface.organizationUserMembershipsSelf.affiliatedOrganizationsTable()))
    .toContain(organization.legal_name);
  expect(await readOrEmpty(() => surface.organizationUserMembershipsSelf.ownedOrganizationsTable())).not.toContain(
    organization.legal_name,
  );

  // The affiliated table does not tell an administrator from an ordinary member. What does is
  // the organization's full record, which an ordinary member is not shown (R-3.3).
  await surface.organizationEdit.open({ orgId: organization.id });
  expect(await readOrEmpty(() => surface.organizationEdit.organizationTab())).not.toContain(organization.legal_name);
});

test("ownership of an organization cannot be transferred to a member whose invitation is still pending", async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  await surface.organizationEdit.addTeamMembers({ emails: [seed.users.invitedVendor.email] });

  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: organization.id });
  await expect
    .poll(() => readOrEmpty(() => surface.organizationEdit.pendingBadge()), { message: "no invitation stands pending" })
    .toBeTruthy();

  await attempt(() => surface.organizationEdit.changeOwner({ newOwner: seed.users.invitedVendor }));

  await stillOwnedByItsOwner(surface);
  expect(await ownedBy(surface, persona.invitedVendor)).not.toContain(organization.legal_name);
});

test("only a service administrator may transfer ownership of an organization, not the organization's own owner", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  await attempt(() => surface.organizationEdit.changeOwner({ newOwner: seed.users.organizationMember }));

  await stillOwnedByItsOwner(surface);
  expect(await ownedBy(surface, persona.organizationMember)).not.toContain(organization.legal_name);
});
