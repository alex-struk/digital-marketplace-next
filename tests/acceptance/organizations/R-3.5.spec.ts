// criterion: @R-3.5 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

const edited = {
  contactName: "Owner Edited Contact Name",
  contactPhone: "250-555-0135",
};

test("every other edited field is saved but the contact phone number is not updated", async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.editOrganization();
  await surface.organizationEdit.saveChanges(edited);

  const profile = await surface.organizationEdit.organizationTab();
  expect(profile).toContain(edited.contactName);
  expect(profile).not.toContain(edited.contactPhone);
});
