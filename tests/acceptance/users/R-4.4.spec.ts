// criterion: @R-4.4 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona } from "../../fixtures";

// The deactivated-vendor persona is the account an administrator deactivated, and its one
// stated ability is to attempt a sign-in and be refused. That no session was created is
// read from the address that stands for whoever is signed in: with no session it offers
// the sign-in choice rather than a profile.
test("a person whose account an administrator deactivated cannot sign in; they are shown a sign-in failure notice instead of being let in", async ({
  surface,
}) => {
  await surface.signIn(persona.deactivatedVendor);

  expect(await surface.userNotice.signInFailedNotice()).toBeTruthy();

  await surface.userProfile.open();
  expect(await surface.userSignIn.vendorCard()).toBeTruthy();
});
