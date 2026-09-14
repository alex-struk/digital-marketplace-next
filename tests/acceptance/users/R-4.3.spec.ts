// criterion: @R-4.3 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The profile-completion screen is offered only to a vendor who has not yet agreed to the
// current terms (R-4.23), and the surface has one way to put a vendor into that state: an
// administrator announcing that the terms have changed, which withdraws every vendor's
// standing acceptance. That announcement is setup here, not the claim.
async function withdrawEveryVendorsAcceptance(surface: Surface): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.notificationTermsBroadcast.open();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();
  await surface.signOut();
}

test("a vendor cannot finish signing up until they confirm they have read and agree to the service's terms and conditions and its privacy policy", async ({
  surface,
}) => {
  await withdrawEveryVendorsAcceptance(surface);

  await surface.signIn(persona.vendorWithTermsReset);
  await surface.userSignUpComplete.open();

  expect(await surface.userSignUpComplete.termsCheckbox()).toBeTruthy();
  expect(await surface.userSignUpComplete.completeDisabledUntilTermsAccepted()).toBeTruthy();

  await surface.userSignUpComplete.acceptAppTerms();
  expect(await surface.userSignUpComplete.completeDisabledUntilTermsAccepted()).toBeFalsy();
});

// The moment of acceptance is read back from the vendor's own legal section, which is where
// the date and time a vendor agreed is stated (R-4.33). The second, older date the service
// keeps — when terms were last accepted at all — is not separable here: the legal section
// carries one accepted-on notice.
test("the moment of acceptance is recorded on the vendor's account", async ({ surface }) => {
  await withdrawEveryVendorsAcceptance(surface);

  await surface.signIn(persona.vendorWithTermsReset);
  await surface.userSignUpComplete.open();
  await surface.userSignUpComplete.acceptAppTerms();
  await surface.userSignUpComplete.completeProfile();

  await surface.userProfileSelfLegal.open();
  expect(await surface.userProfileSelfLegal.acceptedOnNotice()).toBeTruthy();
  expect(await surface.userProfileSelfLegal.termsUpdatedWarning()).toBeFalsy();
});

test("a public sector employee is never asked to agree to the terms", async ({ surface }) => {
  await withdrawEveryVendorsAcceptance(surface);

  await surface.signIn(persona.publicSectorStaff);
  await surface.userSignUpComplete.open();

  expect(await surface.userSignUpComplete.termsCheckbox()).toBeFalsy();
  expect(await surface.userSignUpComplete.completeDisabledUntilTermsAccepted()).toBeFalsy();
});
