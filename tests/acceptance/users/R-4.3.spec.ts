// criterion: @R-4.3 v1
// provenance: blind, spec@ccc1cba3290f5ea17351e4f2ca49bd80fefc2ef6, derived 2026-09-29
import { test, expect, persona } from "../../fixtures";

// Every test begins with a first-time persona: an identity the sandbox identity provider
// carries and the seed does not, so the account is the one made at this sign-in and has
// never agreed to anything. That is the vendor on the profile-completion page with the
// agreement box unticked that the criterion's given describes.
//
// What the completion control reports while unavailable is not stated in the contract, so
// the first test holds it to changing once the box is ticked rather than to a value.

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

test("a vendor cannot finish signing up until they confirm they have read and agree to the service's terms and conditions and its privacy policy", async ({
  surface,
}) => {
  await surface.signIn(persona.firstTimeVendor);
  await surface.userSignUpComplete.open();

  expect(await readOrEmpty(() => surface.userSignUpComplete.termsCheckbox())).toBeTruthy();
  const unticked = await surface.userSignUpComplete.completeDisabledUntilTermsAccepted();

  await surface.userSignUpComplete.acceptAppTerms();
  expect(await surface.userSignUpComplete.completeDisabledUntilTermsAccepted()).not.toBe(unticked);
});

test("the moment of acceptance is recorded on the vendor's account", async ({ surface }) => {
  await surface.signIn(persona.firstTimeVendor);
  await surface.userSignUpComplete.open();
  await surface.userSignUpComplete.acceptAppTerms();
  await surface.userSignUpComplete.completeProfile();

  await surface.userProfileSelfLegal.open();
  const accepted = await readOrEmpty(() => surface.userProfileSelfLegal.acceptedOnNotice());
  expect(accepted).toBeTruthy();
  expect(accepted).toMatch(/\d/);
});

test("a public sector employee is never asked to agree to the terms and conditions and the privacy policy", async ({
  surface,
}) => {
  await surface.signIn(persona.firstTimePublicSectorEmployee);
  await surface.userSignUpComplete.open();

  expect(await readOrEmpty(() => surface.userSignUpComplete.termsCheckbox())).toBeFalsy();
});
