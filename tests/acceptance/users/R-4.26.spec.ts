// criterion: @R-4.26 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("a signed-in person can open their own profile through a fixed address that stands for whoever is signed in, without knowing their own account identifier", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.userProfile.open({ userId: "me" });

  expect(await surface.userProfile.emailField()).toContain(seed.users.vendorOne.email);
  expect(await surface.userProfile.notFoundPage()).toBeFalsy();
});
