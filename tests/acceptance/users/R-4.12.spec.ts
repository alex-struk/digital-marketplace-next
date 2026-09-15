// criterion: @R-4.12 v1
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Whether a person holds administrator rights is read from the administrator box on their
// profile as an administrator sees it, and compared with how it read before, so the test never
// assumes what a ticked or unticked box reads as. The account-kind label is read only where
// the criterion itself turns on the kind: an ordinary public sector employee account.
//
// Where the criterion says someone may not grant the rights, what is asserted is the outcome —
// the account is unchanged — whether the screen offers no way to try or offers one and refuses.
// An attempt that finds no control to use is that first case, and is not a failure.

async function readRights(surface: Surface, userId: string) {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId });
  return {
    rights: await surface.userProfile.adminCheckbox(),
    kind: await surface.userProfile.accountType(),
  };
}

async function attemptToggle(surface: Surface): Promise<void> {
  try {
    await surface.userProfile.toggleAdminPermission();
  } catch {
    // No control was offered to use.
  }
}

test("an administrator may grant administrator rights over a public sector employee's account", async ({ surface }) => {
  const before = await readRights(surface, seed.users.staffOne.id);

  await surface.userProfile.toggleAdminPermission();

  await surface.userProfile.open({ userId: seed.users.staffOne.id });
  expect(await surface.userProfile.adminCheckbox()).not.toBe(before.rights);
});

test("withdrawing the rights returns the person to an ordinary public sector employee account", async ({ surface }) => {
  const ordinary = await readRights(surface, seed.users.staffOne.id);

  await surface.userProfile.toggleAdminPermission();
  await surface.userProfile.open({ userId: seed.users.staffOne.id });
  expect(await surface.userProfile.adminCheckbox()).not.toBe(ordinary.rights);

  await surface.userProfile.toggleAdminPermission();

  await surface.userProfile.open({ userId: seed.users.staffOne.id });
  expect(await surface.userProfile.adminCheckbox()).toBe(ordinary.rights);
  expect(await surface.userProfile.accountType()).toBe(ordinary.kind);
});

test("a vendor can never be granted administrator rights", async ({ surface }) => {
  const before = await readRights(surface, seed.users.vendorOne.id);

  await attemptToggle(surface);

  const after = await readRights(surface, seed.users.vendorOne.id);
  expect(after.rights).toBe(before.rights);
  expect(after.kind).toBe(before.kind);
});

// The one person other than an administrator who can open a public sector employee's account
// is that employee, so "only an administrator" is tried by the employee on their own account.
test("only an administrator may grant or withdraw administrator rights", async ({ surface }) => {
  const before = await readRights(surface, seed.users.staffOne.id);

  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open({ userId: seed.users.staffOne.id });
  await attemptToggle(surface);

  const after = await readRights(surface, seed.users.staffOne.id);
  expect(after.rights).toBe(before.rights);
  expect(after.kind).toBe(before.kind);
});
