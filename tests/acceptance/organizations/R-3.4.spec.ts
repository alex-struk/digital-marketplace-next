// criterion: @R-3.4 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

const rejectedLegalName = "Northern Pines Renamed By Organization Administrator Ltd.";

test("an organization administrator who edits the legal name and saves has the change refused and an error is shown", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationAdmin);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.editOrganization();
  await surface.organizationEdit.saveChanges({ legalName: rejectedLegalName });

  expect(await surface.organizationEdit.fieldError()).toBeTruthy();

  await surface.organizationList.open();
  const listed = await surface.organizationList.organizationName();
  expect(listed).not.toContain(rejectedLegalName);
  expect(listed).toContain(seed.organizations.qualified.legal_name);
});
