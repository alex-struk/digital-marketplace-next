// criterion: @R-3.3 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";

// The given is the seed's qualified organization: owned by seed.users.organizationOwner, with
// seed.users.organizationAdmin holding administrator rights and seed.users.organizationMember an
// ordinary member. The target is put back to that seed before every test, which is also what
// makes each of these accounts active and the member of public sector staff one who holds no
// administrator rights, so neither is re-established here.
const organization = seed.organizations.qualified;

// The criterion's own note says the ordinary member is shown a page that is not there rather
// than a refusal, so being refused is read as the organization's record not being shown.
test("an organization's full record cannot be opened by an ordinary member of that organization", async ({ surface }) => {
  await surface.signIn(persona.organizationMember);
  await surface.organizationEdit.open({ orgId: organization.id });
  expect(await surface.organizationEdit.organizationTab()).not.toContain(organization.legal_name);
});

test("an organization's full record cannot be opened by a member of public sector staff", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.organizationEdit.open({ orgId: organization.id });
  expect(await surface.organizationEdit.organizationTab()).not.toContain(organization.legal_name);
});

test("an organization's full record can be opened by the member who owns that organization", async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  await expect.poll(() => surface.organizationEdit.organizationTab()).toContain(organization.legal_name);
});

test("an organization's full record can be opened by a member who administers that organization", async ({ surface }) => {
  await surface.signIn(persona.organizationAdmin);
  await surface.organizationEdit.open({ orgId: organization.id });
  await expect.poll(() => surface.organizationEdit.organizationTab()).toContain(organization.legal_name);
});

test("an organization's full record can be opened by an administrator", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: organization.id });
  await expect.poll(() => surface.organizationEdit.organizationTab()).toContain(organization.legal_name);
});
