// criterion: @R-4.26 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// user-profile-self is the fixed address that stands for whoever is signed in, and it is
// opened without any identifier. That the profile which comes back is the signed-in
// person's own is read from the sign-in username and address it states, which the seed
// carries for each account and which no other account shares. Two different people open the
// same address, so the answer is shown to follow the person rather than the address.
test("a signed-in person can open their own profile through a fixed address that stands for whoever is signed in, without knowing their own account identifier", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.userProfileSelf.open();

  expect(await surface.userProfileSelf.idpUsernameReadonly()).toContain(seed.users.vendorOne.idp_id);
  expect(await surface.userProfileSelf.emailField()).toContain(seed.users.vendorOne.email);

  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfileSelf.open();

  expect(await surface.userProfileSelf.idpUsernameReadonly()).toContain(seed.users.staffOne.idp_id);
  expect(await surface.userProfileSelf.emailField()).toContain(seed.users.staffOne.email);
});
