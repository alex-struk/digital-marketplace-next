// criterion: @R-4.33 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona } from "../../fixtures";

// The vendor is given an acceptance to read back rather than assumed to hold one: the terms
// are announced as changed and the vendor agrees to them, which is the acceptance whose date
// and time the section then states.
test("a vendor's profile carries a section setting out the privacy policy, the service's terms and conditions with the date and time they agreed to them, and the terms of each of the three programs", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.notificationTermsBroadcast.open();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await surface.userProfileLegal.open();
  await surface.userProfileLegal.acceptUpdatedTerms();
  await surface.userProfileLegal.confirmAcceptUpdatedTerms();

  await surface.userProfileLegal.open();
  expect(await surface.userProfileLegal.privacyPolicy()).toBeTruthy();
  expect(await surface.userProfileLegal.appTermsLink()).toBeTruthy();
  expect(await surface.userProfileLegal.acceptedOnNotice()).toBeTruthy();
  expect(await surface.userProfileLegal.programTermsLinks()).toBeTruthy();
});

test("nobody but a vendor is shown the section", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open();
  expect(await surface.userProfile.legalTab()).toBeFalsy();

  await surface.userProfileLegal.open();
  expect(await surface.userProfileLegal.privacyPolicy()).toBeFalsy();
  expect(await surface.userProfileLegal.acceptedOnNotice()).toBeFalsy();

  // Asking for a section that does not belong to the profile shows the profile instead.
  expect(await surface.userProfile.nameField()).toBeTruthy();
});
