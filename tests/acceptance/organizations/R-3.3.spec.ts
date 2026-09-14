// criterion: @R-3.3 v1
// provenance: blind, spec@1c3743e9fb53c29de89a28045222abab29c5e27e, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// The seeded qualified organization is the criterion's given: an owner, one organization
// administrator and one ordinary member.
const organization = seed.organizations.qualified;

// organization-edit carries no refusal or not-found observation of its own, so being
// refused is read as the organization's record not being shown. The second test in this
// file shows the same observation does carry the record for somebody who may see it, so an
// absence here is the refusal and not an observation that returns nothing for anyone.
test("the ordinary member, and separately a member of public sector staff, opening the organization's management page are both refused", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationMember);
  await surface.organizationEdit.open({ orgId: organization.id });
  expect(await surface.organizationEdit.organizationTab()).not.toContain(organization.legal_name);

  await surface.signIn(persona.publicSectorStaff);
  await surface.organizationEdit.open({ orgId: organization.id });
  expect(await surface.organizationEdit.organizationTab()).not.toContain(organization.legal_name);
});

test("the owner, the organization's administrator and a service administrator each see the organization", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  expect(await surface.organizationEdit.organizationTab()).toContain(organization.legal_name);

  await surface.signIn(persona.organizationAdmin);
  await surface.organizationEdit.open({ orgId: organization.id });
  expect(await surface.organizationEdit.organizationTab()).toContain(organization.legal_name);

  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: organization.id });
  expect(await surface.organizationEdit.organizationTab()).toContain(organization.legal_name);
});
