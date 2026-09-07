// criterion: @R-4.12 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("only an administrator may grant administrator rights, and only over a public sector employee's account", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.staffOne.id });
  const beforeGranting = await surface.userProfile.adminCheckbox();

  await surface.userProfile.toggleAdminPermission();
  expect(await surface.userProfile.adminCheckbox()).not.toBe(beforeGranting);

  await surface.userProfile.toggleAdminPermission();
});

test("withdrawing the rights returns the person to an ordinary public sector employee account", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.staffOne.id });
  const ordinaryPublicSectorEmployee = await surface.userProfile.accountType();

  await surface.userProfile.toggleAdminPermission();
  expect(await surface.userProfile.accountType()).not.toBe(ordinaryPublicSectorEmployee);

  await surface.userProfile.toggleAdminPermission();
  expect(await surface.userProfile.accountType()).toBe(ordinaryPublicSectorEmployee);
});

test("a vendor can never be granted administrator rights", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.vendorOne.id });
  const beforeAttempting = await surface.userProfile.accountType();

  await surface.userProfile.toggleAdminPermission();

  await surface.userProfile.open({ userId: seed.users.vendorOne.id });
  expect(await surface.userProfile.accountType()).toBe(beforeAttempting);
});
