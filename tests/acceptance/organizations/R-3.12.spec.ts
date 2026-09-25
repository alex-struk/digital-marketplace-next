// criterion: @R-3.12 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Persona, Surface } from "../../fixtures";

// The given is the seed's qualified organization: its owner (seed.users.organizationOwner),
// seed.users.organizationAdmin, an active member who already holds administrator rights, and
// seed.users.organizationMember, an active ordinary member. The target is put back to that seed
// before every test.
const organization = seed.organizations.qualified;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

// Nothing on the team surface reads which rights a member holds, so a person's administrator
// rights over the organization are read by what those rights let them do: open the
// organization's full record, which an ordinary member is not shown (R-3.3).
async function seesFullRecord(surface: Surface, who: Persona): Promise<string> {
  await surface.signIn(who);
  await surface.organizationEdit.open({ orgId: organization.id });
  return readOrEmpty(() => surface.organizationEdit.organizationTab());
}

async function stillAdministers(surface: Surface, who: Persona): Promise<void> {
  await surface.signIn(who);
  await surface.organizationEdit.open({ orgId: organization.id });
  await expect
    .poll(() => readOrEmpty(() => surface.organizationEdit.organizationTab()), { message: "the administrator's rights were withdrawn" })
    .toContain(organization.legal_name);
}

async function stillOwns(surface: Surface): Promise<void> {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationUserMembershipsSelf.open();
  await expect
    .poll(() => readOrEmpty(() => surface.organizationUserMembershipsSelf.ownedOrganizationsTable()), {
      message: "the owner no longer owns the organization",
    })
    .toContain(organization.legal_name);
  await stillAdministers(surface, persona.organizationOwner);
}

// The criterion promises a refusal, not a message. A choice that is shown but cannot be
// changed, or is not offered at all, is that refusal, so an attempt the page does not let
// through is not itself a failure; what is asserted afterwards is that nobody's rights moved.
async function attempt(action: () => Promise<void>): Promise<void> {
  await action().catch(() => undefined);
}

test("an organization's owner may grant administrator rights over the organization to an active member", async ({ surface }) => {
  expect(await seesFullRecord(surface, persona.organizationMember), "the member already holds administrator rights").not.toContain(
    organization.legal_name,
  );

  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  await surface.organizationEdit.acceptOrgAdminTerms();
  await surface.organizationEdit.toggleMemberAdminStatus({ member: seed.users.organizationMember });

  await stillAdministers(surface, persona.organizationMember);
});

test("nobody may change their own administrator rights over the organization", async ({ surface }) => {
  await surface.signIn(persona.organizationAdmin);
  await surface.organizationEdit.open({ orgId: organization.id });
  await attempt(() => surface.organizationEdit.toggleMemberAdminStatus({ member: seed.users.organizationAdmin }));

  await stillAdministers(surface, persona.organizationAdmin);
  await stillOwns(surface);
});

test("the owner's own membership cannot be changed by granting or withdrawing administrator rights", async ({ surface }) => {
  await surface.signIn(persona.organizationAdmin);
  await surface.organizationEdit.open({ orgId: organization.id });
  await attempt(() => surface.organizationEdit.acceptOrgAdminTerms());
  await attempt(() => surface.organizationEdit.toggleMemberAdminStatus({ member: seed.users.organizationOwner }));

  await stillOwns(surface);
  await stillAdministers(surface, persona.organizationAdmin);
});
