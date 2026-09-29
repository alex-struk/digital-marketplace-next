// criterion: @R-4.23 v2
// provenance: blind, spec@0518dccea59a1ad5bce1f3b3ed4a00d0c8c61c73, derived 2026-09-29
import { test, expect, persona } from "../../fixtures";

// Every starting state is the seed's own, put back before each test. The vendor who has
// not yet agreed is seed.users.vendorCompletingProfile, whose account has never agreed to
// the terms. The vendor who has agreed before is seed.users.vendorWithTermsReset, who agreed
// once and whose agreement no longer covers the current terms: that is the case the
// criterion sends to the dashboard although the vendor stands unagreed today, so it tells
// "has agreed before" apart from "agrees now".
//
// Being offered the page is read as its terms checkbox being shown; being sent elsewhere as
// that checkbox being absent and the destination's own screen being there instead. What a
// vendor's dashboard lists depends on their proposals, so it is read as showing either its
// table or its empty message.

test("the profile-completion page is offered to a vendor who has not yet agreed to the terms", async ({
  surface,
}) => {
  await surface.signIn(persona.vendorCompletingProfile);
  await surface.userSignUpComplete.open();

  expect(await surface.userSignUpComplete.termsCheckbox()).toBeTruthy();
});

test("a vendor who has agreed before is sent to their dashboard instead of the profile-completion page", async ({
  surface,
}) => {
  await surface.signIn(persona.vendorWithTermsReset);
  await surface.userSignUpComplete.open();

  expect(await surface.userSignUpComplete.termsCheckbox()).toBeFalsy();
  const dashboard =
    (await surface.proposalVendorDashboard.myProposalsTable()) ||
    (await surface.proposalVendorDashboard.emptyMyProposalsMessage());
  expect(dashboard).toBeTruthy();
});

test("any signed-in person who is not a vendor is sent to their dashboard instead of the profile-completion page", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userSignUpComplete.open();

  expect(await surface.userSignUpComplete.termsCheckbox()).toBeFalsy();
  const dashboard =
    (await surface.opportunityDashboard.myOpportunitiesTable()) ||
    (await surface.opportunityDashboard.emptyMyOpportunitiesMessage());
  expect(dashboard).toBeTruthy();
});

test("a visitor who is not signed in is sent to sign in instead of the profile-completion page", async ({
  surface,
}) => {
  await surface.userSignUpComplete.open();

  expect(await surface.userSignUpComplete.termsCheckbox()).toBeFalsy();
  expect(await surface.userSignIn.vendorCard()).toBeTruthy();
});
