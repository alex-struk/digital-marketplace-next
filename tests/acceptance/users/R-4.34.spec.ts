// criterion: @R-4.34 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

test("a vendor's own profile offers profile, capabilities, organizations, notifications and legal sections", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.userProfileSelf.open();

  expect(await surface.userProfileSelf.profileTab()).toBeTruthy();
  expect(await surface.userProfileSelf.capabilitiesTab()).toBeTruthy();
  expect(await surface.userProfileSelf.organizationsTab()).toBeTruthy();
  expect(await surface.userProfileSelf.notificationsTab()).toBeTruthy();
  expect(await surface.userProfileSelf.legalTab()).toBeTruthy();
});

test("a public sector employee's own profile offers profile and notifications", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfileSelf.open();

  expect(await surface.userProfileSelf.profileTab()).toBeTruthy();
  expect(await surface.userProfileSelf.notificationsTab()).toBeTruthy();
  expect(await surface.userProfileSelf.capabilitiesTab()).toBeFalsy();
  expect(await surface.userProfileSelf.organizationsTab()).toBeFalsy();
  expect(await surface.userProfileSelf.legalTab()).toBeFalsy();
});

test("an administrator looking at somebody else's account sees the profile section alone", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.vendorOne.id });

  expect(await surface.userProfile.profileTab()).toBeTruthy();
  expect(await surface.userProfile.capabilitiesTab()).toBeFalsy();
  expect(await surface.userProfile.organizationsTab()).toBeFalsy();
  expect(await surface.userProfile.notificationsTab()).toBeFalsy();
  expect(await surface.userProfile.legalTab()).toBeFalsy();
});
