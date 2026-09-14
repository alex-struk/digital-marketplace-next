// criterion: @R-4.31 v2
// provenance: blind, spec@1c3743e9fb53c29de89a28045222abab29c5e27e, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// The criterion's first outcome, a second deactivation of an account that is already inactive
// being refused with a message saying so, has no request the surface can make and no
// observation to read it by. deactivate_account on user-profile is the control on a profile,
// which an inactive account's profile offers reactivation in place of, and no page carries an
// already-inactive refusal. The same holds for the service accepting a deactivation an
// administrator aims at their own account: the control the criterion says is withheld is the
// only way to ask.
//
// What is reachable is the interface restriction, read against a profile that does offer the
// control, so its absence is the absence of something the screen otherwise has.
test("an administrator viewing their own profile is offered no deactivation control", async ({ surface }) => {
  await surface.signIn(persona.administrator);

  // The comparison account is established as active, not assumed: the signed-in administrator
  // is active by being signed in, so their own badge is what "active" reads as.
  await surface.userProfile.open({ userId: seed.users.administratorOne.id });
  const active = await surface.userProfile.statusBadge();

  await surface.userProfile.open({ userId: seed.users.vendorOne.id });
  if ((await surface.userProfile.statusBadge()) !== active) {
    await surface.userProfile.reactivateAccount();
    await surface.userProfile.confirmActivationChange();
    await surface.userProfile.open({ userId: seed.users.vendorOne.id });
  }
  expect(await surface.userProfile.statusBadge()).toBe(active);
  expect(await surface.userProfile.profileTab()).toContain("Deactivate");

  await surface.userProfile.open({ userId: seed.users.administratorOne.id });
  expect(await surface.userProfile.idpUsernameReadonly()).toContain(seed.users.administratorOne.idp_id);
  expect(await surface.userProfile.profileTab()).not.toContain("Deactivate");

  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.idpUsernameReadonly()).toContain(seed.users.administratorOne.idp_id);
  expect(await surface.userProfileSelf.profileTab()).not.toContain("Deactivate");
});
