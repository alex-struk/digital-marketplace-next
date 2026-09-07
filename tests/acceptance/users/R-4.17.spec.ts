// criterion: @R-4.17 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// The other outcome the criterion names — being told that signing out failed — has no
// path through the surface: nothing offered here makes signing out fail.
test("signing out ends the person's session and the person is told they have been signed out", async ({ surface }) => {
  await surface.signIn(persona.vendor);
  await surface.signOut();

  expect(await surface.userSignOut.signedOutMessage()).toBeTruthy();

  await surface.userProfile.open({ userId: "me" });
  expect(await surface.userSignIn.vendorCard()).toBeTruthy();
});
