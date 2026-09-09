// criterion: @R-4.3 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The profile-completion screen is offered only to a vendor who has not yet agreed to the
// current terms (R-4.23), and the surface has exactly one way to put a vendor back into
// that state: an administrator announcing that the terms have changed, which withdraws
// every vendor's standing acceptance. That announcement is setup here, not the claim.
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

// The moment of acceptance is read back from the legal section, which is where the date
// and time a vendor agreed to the terms is stated (R-4.33). That the service also keeps a
// second, older date — the terms were last accepted at all — is not separable here: the
// legal section carries one accepted-on notice.
test("the moment of acceptance is recorded on the vendor's account", async ({ surface }) => {
  await withdrawEveryVendorsAcceptance(surface);

  await surface.signIn(persona.vendorWithTermsReset);
  await surface.userSignUpComplete.open();
  await surface.userSignUpComplete.acceptAppTerms();
  await surface.userSignUpComplete.completeProfile();

  await surface.userProfileLegal.open({ user: seed.users.vendorWithTermsReset.id });
  expect(await surface.userProfileLegal.acceptedOnNotice()).toBeTruthy();
  expect(await surface.userProfileLegal.termsUpdatedWarning()).toBeFalsy();
});

test("a public sector employee is never asked to agree to the terms", async ({ surface }) => {
  await withdrawEveryVendorsAcceptance(surface);

  await surface.signIn(persona.publicSectorStaff);
  await surface.userSignUpComplete.open();

  expect(await surface.userSignUpComplete.termsCheckbox()).toBeFalsy();
  expect(await surface.userSignUpComplete.completeDisabledUntilTermsAccepted()).toBeFalsy();
});
