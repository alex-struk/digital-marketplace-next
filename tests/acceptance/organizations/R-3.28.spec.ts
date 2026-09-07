// criterion: @R-3.28 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

const kept = seed.organizations.qualified.service_areas[0];
const cleared = seed.organizations.qualified.service_areas[1];

test("when an administrator saves a selection of service areas the organization is approved for exactly the areas that were ticked and no longer for the one that was cleared", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.editServiceAreas();
  await surface.organizationEdit.saveServiceAreas({ serviceAreas: [kept] });

  const approved = await surface.organizationEdit.serviceAreaCheckbox();
  expect(approved).toContain(kept);
  expect(approved).not.toContain(cleared);
});
