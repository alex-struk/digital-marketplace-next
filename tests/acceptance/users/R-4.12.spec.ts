// criterion: @R-4.12 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// "Only an administrator may grant or withdraw" is not asserted by having a third party
// try: nobody but the person themselves or an administrator can open an account at all
// (R-4.25), so there is no profile for anyone else to find the control on. What is
// asserted instead, in the last test, is the criterion's own note: an ordinary public sector
// employee looking at their own account is shown their permissions as a label, not a control.
//
// Each grant is withdrawn within the same test, so seed.users.staffOne is left an ordinary
// public sector employee.
test("a public sector employee becomes an administrator immediately when an administrator grants them administrator rights", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.staffOne.id });
  const ordinary = await surface.userProfile.accountType();

  await surface.userProfile.toggleAdminPermission();

  await surface.userProfile.open({ userId: seed.users.staffOne.id });
  expect(await surface.userProfile.accountType()).not.toBe(ordinary);

  await surface.userProfile.toggleAdminPermission();
});

test("withdrawing the rights returns the person to an ordinary public sector employee account", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.staffOne.id });
  const ordinary = await surface.userProfile.accountType();

  await surface.userProfile.toggleAdminPermission();
  await surface.userProfile.open({ userId: seed.users.staffOne.id });
  await surface.userProfile.toggleAdminPermission();

  await surface.userProfile.open({ userId: seed.users.staffOne.id });
  expect(await surface.userProfile.accountType()).toBe(ordinary);
});

test("a vendor can never be granted administrator rights, and the request against a vendor's account is refused", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.vendorOne.id });
  const before = await surface.userProfile.accountType();

  await surface.userProfile.toggleAdminPermission();
  expect(await surface.userProfile.fieldError()).toBeTruthy();

  await surface.userProfile.open({ userId: seed.users.vendorOne.id });
  expect(await surface.userProfile.accountType()).toBe(before);
});

// The permissions label and the administrator box are offered on the profile addressed by
// identifier only, so the employee opens their own account by the identifier the seed gives it.
test("an ordinary public sector employee is offered no control to grant administrator rights, only a statement of their permissions", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open({ userId: seed.users.staffOne.id });

  expect(await surface.userProfile.notFoundPage()).toBeFalsy();
  expect(await surface.userProfile.permissionsLabel()).toBeTruthy();
  expect(await surface.userProfile.adminCheckbox()).toBeFalsy();
});
