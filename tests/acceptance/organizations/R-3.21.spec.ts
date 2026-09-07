// criterion: @R-3.21 v2
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("a vendor who is neither owner nor administrator of an organization sees its legal name without the owner, the team size or the qualification marks", async ({
  surface,
}) => {
  await surface.signIn(persona.fileUploader);
  await surface.organizationList.open();

  expect(await surface.organizationList.organizationName()).toContain(seed.organizations.qualified.legal_name);
  expect(await surface.organizationList.ownerName()).toBeFalsy();
  expect(await surface.organizationList.swuQualifiedMark()).toBeFalsy();
  expect(await surface.organizationList.twuQualifiedMark()).toBeFalsy();
});

test("the same row shown to a service administrator carries the owner's name and both qualification marks", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.organizationList.open();

  expect(await surface.organizationList.organizationName()).toContain(seed.organizations.qualified.legal_name);
  expect(await surface.organizationList.ownerName()).toBeTruthy();
  expect(await surface.organizationList.swuQualifiedMark()).toBeTruthy();
  expect(await surface.organizationList.twuQualifiedMark()).toBeTruthy();
});

test("the owner and qualification columns are not offered at all to a visitor who is not signed in", async ({
  surface,
}) => {
  await surface.organizationList.open();

  expect(await surface.organizationList.ownerName()).toBeFalsy();
  expect(await surface.organizationList.swuQualifiedMark()).toBeFalsy();
  expect(await surface.organizationList.twuQualifiedMark()).toBeFalsy();
});

test("the owner and qualification columns are not offered at all to public sector staff", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.organizationList.open();

  expect(await surface.organizationList.ownerName()).toBeFalsy();
  expect(await surface.organizationList.swuQualifiedMark()).toBeFalsy();
  expect(await surface.organizationList.twuQualifiedMark()).toBeFalsy();
});
