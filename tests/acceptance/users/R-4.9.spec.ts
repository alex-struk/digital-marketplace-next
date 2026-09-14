// criterion: @R-4.9 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// Signing in again is the only route back from an account its owner deactivated (R-4.5),
// so each test below ends by signing in, which leaves the account as it was found.
//
// The recorded date of the deactivation is not returned by any observation. That the
// account is marked as deactivated by its owner rather than by an administrator is read
// from what the administrator's view offers instead: no reactivation control (R-4.19).
test("a person may deactivate their own account, which ends their session at once", async ({ surface }) => {
  await surface.signIn(persona.vendor);
  await surface.userProfileSelf.open();
  await surface.userProfileSelf.deactivateAccount();
  expect(await surface.userProfileSelf.activationModal()).toBeTruthy();
  await surface.userProfileSelf.confirmActivationChange();

  expect(await surface.userNotice.deactivatedOwnAccountNotice()).toBeTruthy();

  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.signInRequired()).toBeTruthy();

  await surface.signIn(persona.vendor);
});

test("the account is kept rather than erased, and is marked as deactivated by the person themselves", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.vendorOne.id });
  const whileActive = await surface.userProfile.statusBadge();

  await surface.signIn(persona.vendor);
  await surface.userProfileSelf.open();
  await surface.userProfileSelf.deactivateAccount();
  await surface.userProfileSelf.confirmActivationChange();

  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.vendorOne.id });

  expect(await surface.userProfile.notFoundPage()).toBeFalsy();
  expect(await surface.userProfile.emailField()).toContain(seed.users.vendorOne.email);
  expect(await surface.userProfile.statusBadge()).not.toBe(whileActive);
  expect(await surface.userProfile.profileTab()).not.toContain("Reactivate");

  await surface.signIn(persona.vendor);
});

// The message's wording — that they can return by signing in again — is body content the
// mail fixture does not return, so what is asserted is that a message reached them.
test("they are told by email", async ({ surface, mail }) => {
  await surface.signIn(persona.vendor);
  await mail.clear();

  await surface.userProfileSelf.open();
  await surface.userProfileSelf.deactivateAccount();
  await surface.userProfileSelf.confirmActivationChange();

  await expect
    .poll(async () => (await mail.messagesTo(seed.users.vendorOne.email)).length, { timeout: 10000 })
    .toBeGreaterThan(0);

  await surface.signIn(persona.vendor);
});
