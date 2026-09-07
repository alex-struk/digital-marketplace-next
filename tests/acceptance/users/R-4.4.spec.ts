// criterion: @R-4.4 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

test("a person whose account an administrator deactivated cannot sign in; they are shown a sign-in failure notice instead of being let in", async ({
  surface,
}) => {
  await surface.signIn(persona.deactivatedVendor);

  expect(await surface.userNotice.signInFailedNotice()).toBeTruthy();

  // No session was created, so a screen that requires signing in sends them to sign in.
  await surface.userProfile.open({ userId: "me" });
  expect(await surface.userSignIn.vendorCard()).toBeTruthy();
});
