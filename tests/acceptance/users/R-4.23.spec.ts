// criterion: @R-4.23 v2
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

test("the profile-completion page is offered to a vendor who has not yet agreed to the terms", async ({ surface }) => {
  await surface.signIn(persona.vendorWithTermsReset);
  await surface.userSignUpComplete.open();

  expect(await surface.userSignUpComplete.termsCheckbox()).toBeTruthy();
});

test("a vendor who has agreed before is sent to their dashboard instead", async ({ surface }) => {
  await surface.signIn(persona.vendor);
  await surface.userSignUpComplete.open();

  expect(await surface.userSignUpComplete.termsCheckbox()).toBeFalsy();
  expect(await surface.proposalVendorDashboard.emptyMyProposalsMessage()).toBeTruthy();
});

test("any signed-in person who is not a vendor is sent to their dashboard instead", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userSignUpComplete.open();

  expect(await surface.userSignUpComplete.termsCheckbox()).toBeFalsy();
  expect(await surface.opportunityDashboard.myOpportunitiesTable()).toBeTruthy();
});

test("a visitor who is not signed in is sent to sign in", async ({ surface }) => {
  await surface.userSignUpComplete.open();

  expect(await surface.userSignIn.vendorCard()).toBeTruthy();
});
