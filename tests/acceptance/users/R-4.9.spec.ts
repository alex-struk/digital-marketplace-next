// criterion: @R-4.9 v1
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Two parts of the outcome are left unasserted because nothing shows them: the date the
// deactivation was recorded, and the marking that the person did it themselves rather than an
// administrator. No observation on user-profile, user-profile-self or user-list returns either,
// and the status badge is not said to tell the two kinds of inactivity apart.

async function deactivateOwnAccount(surface: Surface): Promise<void> {
  await surface.signIn(persona.vendor);
  await surface.userProfileSelf.open();
  await surface.userProfileSelf.deactivateAccount();
  expect(await surface.userProfileSelf.activationModal()).toBeTruthy();
  await surface.userProfileSelf.confirmActivationChange();
}

test("a person may deactivate their own account, which ends their session at once", async ({ surface }) => {
  await deactivateOwnAccount(surface);

  await expect.poll(() => surface.userNotice.deactivatedOwnAccountNotice()).toBeTruthy();

  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.signInRequired()).toBeTruthy();
});

test("a person who deactivates their own account is told by email", async ({ surface, mail }) => {
  await surface.signIn(persona.vendor);
  await mail.clear();

  await surface.userProfileSelf.open();
  await surface.userProfileSelf.deactivateAccount();
  await surface.userProfileSelf.confirmActivationChange();

  await expect
    .poll(async () => (await mail.messagesTo(seed.users.vendorOne.email)).length, { timeout: 10000 })
    .toBeGreaterThan(0);
});

// "Active" is read as the signed-in administrator's own badge, so the vendor's account is
// shown to be active before and inactive after, and still there to be opened.
test("a person's own deactivation keeps the record rather than erasing it", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.administratorOne.id });
  const active = await surface.userProfile.statusBadge();
  await surface.userProfile.open({ userId: seed.users.vendorOne.id });
  expect(await surface.userProfile.statusBadge()).toBe(active);

  await deactivateOwnAccount(surface);

  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.vendorOne.id });
  expect(await surface.userProfile.notFoundPage()).toBeFalsy();
  expect(await surface.userProfile.idpUsernameReadonly()).toContain(seed.users.vendorOne.idp_id);
  expect(await surface.userProfile.emailField()).toContain(seed.users.vendorOne.email);
  expect(await surface.userProfile.statusBadge()).not.toBe(active);
});
