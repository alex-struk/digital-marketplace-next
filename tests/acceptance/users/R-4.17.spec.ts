// criterion: @R-4.17 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona } from "../../fixtures";

// Two parts are not asserted. That the session with the identity provider ends as well as
// the one with the service is not observable: nothing in the surface reports what the
// identity provider still holds. And the failure notice cannot be produced, because nothing
// in the surface makes a sign-out fail; the most a test can say is that a successful
// sign-out does not report one.
test("signing out ends the person's session with the service, and the person is told they have been signed out", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.signInRequired()).toBeFalsy();

  await surface.signOut();

  expect(await surface.userSignOut.signedOutMessage()).toBeTruthy();
  expect(await surface.userSignOut.signOutFailedMessage()).toBeFalsy();

  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.signInRequired()).toBeTruthy();
});
