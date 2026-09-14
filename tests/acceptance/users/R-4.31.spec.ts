// criterion: @R-4.31 v2
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// Two of the criterion's clauses have no request the surface can make. A second
// deactivation of an account that is already inactive cannot be asked for: an inactive
// account's profile offers reactivation in place of deactivation, and nothing else in the
// surface sends a deactivation. The same is true of the service accepting a deactivation an
// administrator aims at their own account: the control the criterion says is withheld is the
// only way to ask.
//
// What is reachable is the interface restriction, read against a profile that does offer the
// control, so its absence is the absence of something the screen otherwise has.
test("an administrator viewing their own profile is offered no deactivation control", async ({ surface }) => {
  await surface.signIn(persona.administrator);

  await surface.userProfile.open({ userId: seed.users.vendorOne.id });
  expect(await surface.userProfile.profileTab()).toContain("Deactivate");

  await surface.userProfile.open({ userId: seed.users.administratorOne.id });
  expect(await surface.userProfile.idpUsernameReadonly()).toContain(seed.users.administratorOne.idp_id);
  expect(await surface.userProfile.profileTab()).not.toContain("Deactivate");

  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.idpUsernameReadonly()).toContain(seed.users.administratorOne.idp_id);
  expect(await surface.userProfileSelf.profileTab()).not.toContain("Deactivate");
});
