// criterion: @R-3.18 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

const rejectedLegalName = "Northern Pines Renamed Under R-3.18 Ltd.";

test("the service refuses a profile change from an organization administrator who is not the owner", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationAdmin);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.editOrganization();
  await surface.organizationEdit.saveChanges({ legalName: rejectedLegalName });

  await surface.organizationList.open();
  const listed = await surface.organizationList.organizationName();
  expect(listed).not.toContain(rejectedLegalName);
  expect(listed).toContain(seed.organizations.qualified.legal_name);
});

test("the service refuses an archive request from an organization administrator who is not the owner", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationAdmin);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.archiveOrganization();

  await surface.organizationList.open();
  expect(await surface.organizationList.organizationName()).toContain(seed.organizations.qualified.legal_name);
});
