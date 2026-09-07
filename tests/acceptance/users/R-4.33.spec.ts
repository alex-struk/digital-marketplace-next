// criterion: @R-4.33 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

test("a vendor's profile carries a section setting out the privacy policy, the terms and conditions with the date and time they agreed to them, and the terms of each of the three programs", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.userProfileLegal.open({ userId: "me" });

  expect(await surface.userProfileLegal.privacyPolicy()).toBeTruthy();
  expect(await surface.userProfileLegal.appTermsLink()).toBeTruthy();
  expect(await surface.userProfileLegal.acceptedOnNotice()).toBeTruthy();
  expect(await surface.userProfileLegal.programTermsLinks()).toBeTruthy();
});

test("nobody but a vendor is shown it", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open({ userId: "me" });
  expect(await surface.userProfile.legalTab()).toBeFalsy();

  // Asking for the section shows them their profile instead.
  await surface.userProfileLegal.open({ userId: "me" });
  expect(await surface.userProfileLegal.privacyPolicy()).toBeFalsy();
  expect(await surface.userProfile.profileTab()).toBeTruthy();
});
