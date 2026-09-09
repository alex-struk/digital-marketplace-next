// criterion: @R-4.23 v2
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// A vendor who has not yet agreed to the terms is produced by an administrator announcing
// that the terms have changed, which withdraws every vendor's standing acceptance; a vendor
// who has agreed before is that same vendor after they agree again. Both states are made
// here rather than assumed of the seed, because the terms a vendor stands under are changed
// by tests in other domains as well.
async function announceChangedTerms(surface: Surface): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.notificationTermsBroadcast.open();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();
  await surface.signOut();
}

test("the profile-completion page is offered to a vendor who has not yet agreed to the terms", async ({
  surface,
}) => {
  await announceChangedTerms(surface);

  await surface.signIn(persona.vendorWithTermsReset);
  await surface.userSignUpComplete.open();

  expect(await surface.userSignUpComplete.termsCheckbox()).toBeTruthy();
  expect(await surface.userSignUpComplete.nameField()).toBeTruthy();
});

// Where the vendor is sent instead is not read from a dashboard observation: a vendor's
// dashboard lists their own proposals, and whether it carries a table or the empty message
// depends on what other tests have left behind. What is read is that the completion screen
// was not offered to them.
test("a vendor who has agreed before is sent to their dashboard instead", async ({ surface }) => {
  await announceChangedTerms(surface);

  await surface.signIn(persona.vendorWithTermsReset);
  await surface.userProfileLegal.open();
  await surface.userProfileLegal.acceptUpdatedTerms();
  await surface.userProfileLegal.confirmAcceptUpdatedTerms();

  await surface.userSignUpComplete.open();
  expect(await surface.userSignUpComplete.termsCheckbox()).toBeFalsy();
  expect(await surface.userSignUpComplete.completeDisabledUntilTermsAccepted()).toBeFalsy();
});

test("any signed-in person who is not a vendor is sent to their dashboard instead", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userSignUpComplete.open();

  expect(await surface.userSignUpComplete.termsCheckbox()).toBeFalsy();
  expect(await surface.opportunityDashboard.myOpportunitiesTable()).toBeTruthy();
});

test("a visitor who is not signed in is sent to sign in", async ({ surface }) => {
  await surface.signIn(persona.vendor);
  await surface.signOut();

  await surface.userSignUpComplete.open();

  expect(await surface.userSignIn.vendorCard()).toBeTruthy();
  expect(await surface.userSignUpComplete.termsCheckbox()).toBeFalsy();
});
