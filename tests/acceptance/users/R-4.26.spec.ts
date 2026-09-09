// criterion: @R-4.26 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona, seed } from "../../fixtures";

// Opening the profile with no account named is the fixed address that stands for whoever is
// signed in; that the profile which comes back is the signed-in person's own is read from
// the sign-in username the profile states, which the seed carries for each account and
// which no other account shares.
test("a signed-in person can open their own profile through a fixed address that stands for whoever is signed in, without knowing their own account identifier", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.userProfile.open();

  expect(await surface.userProfile.idpUsernameReadonly()).toContain(seed.users.vendorOne.idp_id);
  expect(await surface.userProfile.emailField()).toContain(seed.users.vendorOne.email);

  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open();

  expect(await surface.userProfile.idpUsernameReadonly()).toContain(seed.users.staffOne.idp_id);
  expect(await surface.userProfile.emailField()).toContain(seed.users.staffOne.email);
});
