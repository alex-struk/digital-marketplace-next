// criterion: @R-4.31 v2
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";

// Only the second outcome is reachable. The first — a second deactivation of an account that
// is already inactive being refused with a message saying so — needs a request the surface
// cannot make: deactivate_account on user-profile is the control on a profile, an inactive
// account's profile offers reactivation in its place, and no page carries an already-inactive
// refusal to read. The clause that the service would accept an administrator's deactivation of
// their own account is likewise out of reach, because the withheld control is the only way
// the surface has to ask.
//
// Whether a deactivation control is offered is read from whether using it brings up the
// confirmation, first on a profile that must offer it, so its absence on the administrator's
// own profile is the absence of something the screen otherwise has.
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

  await surface.userProfile.deactivateAccount();
  expect(await surface.userProfile.activationModal()).toBeTruthy();
  await surface.userProfile.cancelActivationChange();

  await surface.userProfile.open({ userId: seed.users.administratorOne.id });
  expect(await surface.userProfile.idpUsernameReadonly()).toContain(seed.users.administratorOne.idp_id);
  try {
    await surface.userProfile.deactivateAccount();
  } catch {
    // No control was offered to use.
  }
  expect(await surface.userProfile.activationModal()).toBeFalsy();

  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.idpUsernameReadonly()).toContain(seed.users.administratorOne.idp_id);
  try {
    await surface.userProfileSelf.deactivateAccount();
  } catch {
    // No control was offered to use.
  }
  expect(await surface.userProfileSelf.activationModal()).toBeFalsy();

  // Nothing was deactivated along the way.
  await surface.userProfile.open({ userId: seed.users.administratorOne.id });
  expect(await surface.userProfile.statusBadge()).toBe(active);
});
