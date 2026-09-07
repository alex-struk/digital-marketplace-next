// criterion: @R-3.26 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("an organization approved for service areas whose Team With Us terms have been accepted is qualified", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });

  expect(await surface.organizationEdit.twuQualifiedBadge()).toBeTruthy();
  expect(await surface.organizationEdit.twuRequirementServiceArea()).toBeTruthy();
  expect(await surface.organizationEdit.twuRequirementTermsAccepted()).toBeTruthy();
});

test("an organization approved for no service area and whose Team With Us terms have not been accepted is marked as not qualified", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.organizationEdit.open({ orgId: seed.organizations.unqualified.id });

  expect(await surface.organizationEdit.twuQualifiedBadge()).toBeFalsy();
  expect(await surface.organizationEdit.notQualifiedNotice()).toBeTruthy();
});
