// criterion: @R-4.6 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona, seed } from "../../fixtures";

// Only the second half of the given can be produced. A second vendor signing in for the
// first time with an address another vendor already holds needs an account to be created,
// and every persona signs in as an account the seed already carries; no surface action
// creates one. What is reachable is the same collision reached by an edit: one vendor
// changing their own address to the address another vendor holds.
//
// The criterion says neither failure is explained, so nothing is asserted about a message
// here; what is asserted is that the change was not saved.
test("two accounts of the same kind may not share an email address, so a vendor's change to an address another vendor holds is not saved", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.userProfile.open();
  const before = await surface.userProfile.emailField();
  expect(before).toContain(seed.users.vendorOne.email);

  await surface.userProfile.editProfile();
  await surface.userProfile.saveChanges({ email: seed.users.organizationOwner.email });

  await surface.userProfile.open();
  const after = await surface.userProfile.emailField();
  expect(after).toBe(before);
  expect(after).not.toContain(seed.users.organizationOwner.email);

  // The other account is untouched by the attempt.
  await surface.signIn(persona.organizationOwner);
  await surface.userProfile.open();
  expect(await surface.userProfile.emailField()).toContain(seed.users.organizationOwner.email);
});
