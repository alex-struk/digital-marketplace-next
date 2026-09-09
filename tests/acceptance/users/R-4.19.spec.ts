// criterion: @R-4.19 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona, seed } from "../../fixtures";

// The last clause — that the service continues to refuse a reactivation request made
// against an account its owner deactivated — is not asserted. The only reactivation request
// the surface makes is the control, and the claim being tested is that the control is not
// offered for such an account, so there is nothing left to press and no other way to send
// the request.
//
// seed.users.vendorDeactivated is the account an administrator deactivated, so the first
// test reads it without changing anything.
test("the control to reactivate an account is offered for an account that an administrator deactivated", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ user: seed.users.vendorDeactivated.id });

  expect(await surface.userProfile.profileTab()).toContain("Reactivate");
});

test("an account its owner deactivated carries no reactivation control; the profile states instead that the person reactivates it themselves by signing in again", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.userProfile.open();
  await surface.userProfile.deactivateAccount();
  await surface.userProfile.confirmActivationChange();

  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ user: seed.users.vendorOne.id });

  const asAdministrator = await surface.userProfile.profileTab();
  expect(asAdministrator).not.toContain("Reactivate");
  expect(asAdministrator).toContain("signing in");

  // Signing in again is the route back, which leaves the account as it was found.
  await surface.signIn(persona.vendor);
});
