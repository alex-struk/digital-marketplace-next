// criterion: @R-4.3 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("a vendor cannot finish signing up until they confirm they have read and agree to the service's terms and conditions and its privacy policy", async ({
  surface,
}) => {
  await surface.signIn(persona.vendorWithTermsReset);
  await surface.userSignUpComplete.open();

  expect(await surface.userSignUpComplete.termsCheckbox()).toBeTruthy();
  expect(await surface.userSignUpComplete.completeDisabledUntilTermsAccepted()).toBeTruthy();
});

test("the moment of acceptance is recorded on the vendor's account", async ({ surface }) => {
  await surface.signIn(persona.vendorWithTermsReset);
  await surface.userSignUpComplete.open();
  await surface.userSignUpComplete.acceptAppTerms();
  await surface.userSignUpComplete.completeProfile();

  await surface.userProfileLegal.open({ userId: seed.users.vendorWithTermsReset.id });
  expect(await surface.userProfileLegal.acceptedOnNotice()).toBeTruthy();
});

test("a public sector employee is never asked to agree to the terms and conditions", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userSignUpComplete.open();

  expect(await surface.userSignUpComplete.termsCheckbox()).toBeFalsy();
});
