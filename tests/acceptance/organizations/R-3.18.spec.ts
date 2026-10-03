// criterion: @R-3.18 v1
// provenance: blind, spec@658792c3c7c79540af12cf18a97a260fc2484f16, derived 2026-10-03
import { test, expect, persona, seed } from "../../fixtures";

// The clause that the service continues to refuse a profile change or an archive request
// from anyone other than the owner or a service administrator cannot be sent through the
// surface without the very controls this criterion requires to be absent; it is recorded
// against this criterion in not-testable.yaml.
test("an organization administrator who is not the owner sees the organization's profile as read-only, with no Edit and no Archive control", async ({
  surface,
}) => {
  // Read the management page as the owner first, so the two controls are known to be
  // offered on it at all; the administrator's reading is told apart from that one rather
  // than merely being empty of words the page might never use.
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  const asOwner = await surface.organizationEdit.organizationTab();

  expect(asOwner).toContain("Edit");
  expect(asOwner).toContain("Archive");

  await surface.signIn(persona.organizationAdmin);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  const asAdministrator = await surface.organizationEdit.organizationTab();

  expect(asAdministrator).toContain(seed.organizations.qualified.legal_name);
  expect(asAdministrator).not.toContain("Edit");
  expect(asAdministrator).not.toContain("Archive");
});

test("the Edit and Archive controls on an organization's management page are offered to a service administrator", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  const asServiceAdministrator = await surface.organizationEdit.organizationTab();

  expect(asServiceAdministrator).toContain("Edit");
  expect(asServiceAdministrator).toContain("Archive");
});
