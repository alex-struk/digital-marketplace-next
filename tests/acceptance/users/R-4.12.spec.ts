// criterion: @R-4.12 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona, seed } from "../../fixtures";

// "Only an administrator may grant or withdraw" is not asserted by having somebody else
// try: nobody but the person themselves or an administrator can open an account at all,
// and is shown a missing-page instead (R-4.25), so there is no profile for a third party
// to find the control on. What the criterion's own note offers instead is asserted in the
// last test: an ordinary public sector employee sees their permissions stated rather than
// offered as a control.
//
// Each test grants and then withdraws within itself, so seed.users.staffOne is left an
// ordinary public sector employee however the run stops.
test("a public sector employee becomes an administrator immediately when an administrator ticks the administrator box on their profile", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ user: seed.users.staffOne.id });
  const ordinary = await surface.userProfile.accountType();

  await surface.userProfile.toggleAdminPermission();

  await surface.userProfile.open({ user: seed.users.staffOne.id });
  expect(await surface.userProfile.accountType()).not.toBe(ordinary);

  await surface.userProfile.toggleAdminPermission();
});

test("withdrawing the rights returns the person to an ordinary public sector employee account", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ user: seed.users.staffOne.id });
  const ordinary = await surface.userProfile.accountType();

  await surface.userProfile.toggleAdminPermission();
  await surface.userProfile.open({ user: seed.users.staffOne.id });
  await surface.userProfile.toggleAdminPermission();

  await surface.userProfile.open({ user: seed.users.staffOne.id });
  expect(await surface.userProfile.accountType()).toBe(ordinary);
});

test("a vendor can never be granted administrator rights, and the request against a vendor's account is refused", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ user: seed.users.vendorOne.id });
  const before = await surface.userProfile.accountType();

  await surface.userProfile.toggleAdminPermission();
  expect(await surface.userProfile.fieldError()).toBeTruthy();

  await surface.userProfile.open({ user: seed.users.vendorOne.id });
  expect(await surface.userProfile.accountType()).toBe(before);
});

test("an ordinary public sector employee viewing their own profile is shown their permissions as a read-only label rather than a control", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open();

  expect(await surface.userProfile.permissionsLabel()).toBeTruthy();
  expect(await surface.userProfile.adminCheckbox()).toBeFalsy();
});
