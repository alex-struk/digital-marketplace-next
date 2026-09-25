// criterion: @R-3.3 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is the seed's qualified organization: owned by seed.users.organizationOwner, with
// seed.users.organizationAdmin holding administrator rights and seed.users.organizationMember an
// ordinary member. The target is put back to that seed before every test.
const organization = seed.organizations.qualified;

// An observation of something the page does not show may answer with nothing or may throw;
// either way it is read here as nothing shown.
async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

// The member of public sector staff is established as one holding no administrator rights from
// the kind of account their own profile names, which every account shows, rather than from a
// statement of permissions, which an account without such rights is not shown at all.
async function signInAsStaffWithoutAdministratorRights(surface: Surface): Promise<void> {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfileSelf.open();
  await expect.poll(() => readOrEmpty(() => surface.userProfileSelf.accountType())).toBeTruthy();
  expect((await surface.userProfileSelf.accountType()).toLowerCase()).not.toContain("admin");
}

async function recordShown(surface: Surface): Promise<string> {
  return readOrEmpty(() => surface.organizationEdit.organizationTab());
}

// The criterion's own note says the ordinary member is shown a page that is not there rather
// than a refusal, so being refused is read as the organization's record not being shown.
test("an organization's full record cannot be opened by an ordinary member of that organization", async ({ surface }) => {
  await surface.signIn(persona.organizationMember);
  await surface.organizationEdit.open({ orgId: organization.id });
  expect(await recordShown(surface)).not.toContain(organization.legal_name);
});

test("an organization's full record cannot be opened by a member of public sector staff", async ({ surface }) => {
  await signInAsStaffWithoutAdministratorRights(surface);
  await surface.organizationEdit.open({ orgId: organization.id });
  expect(await recordShown(surface)).not.toContain(organization.legal_name);
});

test("an organization's full record can be opened by the member who owns that organization", async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  await expect.poll(() => recordShown(surface)).toContain(organization.legal_name);
});

test("an organization's full record can be opened by a member who administers that organization", async ({ surface }) => {
  await surface.signIn(persona.organizationAdmin);
  await surface.organizationEdit.open({ orgId: organization.id });
  await expect.poll(() => recordShown(surface)).toContain(organization.legal_name);
});

test("an organization's full record can be opened by an administrator", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: organization.id });
  await expect.poll(() => recordShown(surface)).toContain(organization.legal_name);
});
