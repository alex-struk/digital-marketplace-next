// criterion: @R-3.19 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

const saved = {
  contactName: "Phone Saving Contact Name",
  contactPhone: "250-555-0177",
};

test("a change to the contact phone number is saved along with every other profile field", async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.editOrganization();
  await surface.organizationEdit.saveChanges(saved);

  const profile = await surface.organizationEdit.organizationTab();
  expect(profile).toContain(saved.contactName);
  expect(profile).toContain(saved.contactPhone);
});

test("clearing the contact phone number removes the stored number", async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.editOrganization();
  await surface.organizationEdit.saveChanges({ contactPhone: "" });

  expect(await surface.organizationEdit.organizationTab()).not.toContain(saved.contactPhone);
});
