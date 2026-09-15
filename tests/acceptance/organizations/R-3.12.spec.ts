// criterion: @R-3.12 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Persona, Surface } from "../../fixtures";

// The given is the seed's qualified organization: its owner, seed.users.organizationAdmin who
// already holds administrator rights, and seed.users.organizationMember, an active ordinary
// member. The target is put back to that seed before every test.
const organization = seed.organizations.qualified;

// Nothing on the team surface reads which role a member holds, so a person's administrator
// rights over the organization are read by what those rights let them do: open the
// organization's management page, which an ordinary member is refused (R-3.3).
async function opensManagementPage(surface: Surface, who: Persona): Promise<void> {
  await surface.signIn(who);
  await surface.organizationEdit.open({ orgId: organization.id });
  await expect.poll(() => surface.organizationEdit.organizationTab()).toContain(organization.legal_name);
}

// The criterion promises a refusal, not a message. A choice that is shown but cannot be
// changed, or is not offered at all, is that refusal, so an attempt the page does not let
// through is not itself a failure; what is asserted is that nobody's rights moved.
async function attempt(action: Promise<void>): Promise<void> {
  await action.catch(() => undefined);
}

test("an organization's owner may grant administrator rights over the organization to an active member", async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  await surface.organizationEdit.acceptOrgAdminTerms();
  await surface.organizationEdit.toggleMemberAdminStatus({ member: seed.users.organizationMember });

  await opensManagementPage(surface, persona.organizationMember);
});

test("nobody may change their own administrator rights over the organization", async ({ surface }) => {
  await surface.signIn(persona.organizationAdmin);
  await surface.organizationEdit.open({ orgId: organization.id });
  await attempt(surface.organizationEdit.toggleMemberAdminStatus({ member: seed.users.organizationAdmin }));

  // Had the withdrawal gone through they would be an ordinary member, and an ordinary member is refused it.
  await opensManagementPage(surface, persona.organizationAdmin);
});

test("the owner's own membership cannot be changed by granting or withdrawing administrator rights", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: organization.id });
  await attempt(surface.organizationEdit.toggleMemberAdminStatus({ member: seed.users.organizationOwner }));

  await surface.signIn(persona.organizationOwner);
  await surface.organizationUserMembershipsSelf.open();
  await expect.poll(() => surface.organizationUserMembershipsSelf.ownedOrganizationsTable()).toContain(organization.legal_name);
  await opensManagementPage(surface, persona.organizationOwner);
});
