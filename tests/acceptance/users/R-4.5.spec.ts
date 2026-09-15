// criterion: @R-4.5 v1
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given — an account its owner deactivated — is made here rather than seeded: the vendor
// deactivates their own account, which is the only thing that produces that form of
// inactivity. The return is the sign-in a person makes, through the sign-in screen, rather
// than the fixture's sign-in, because signing in again is what the criterion is about.
//
// An account's status is stated to an administrator, so "active" is read as the signed-in
// administrator's own badge, and the vendor's badge is compared with that.

async function activeReading(surface: Surface): Promise<string> {
  await surface.userProfile.open({ userId: seed.users.administratorOne.id });
  return surface.userProfile.statusBadge();
}

async function deactivateOwnAccount(surface: Surface): Promise<void> {
  await surface.signIn(persona.administrator);
  const active = await activeReading(surface);
  await surface.userProfile.open({ userId: seed.users.vendorOne.id });
  expect(await surface.userProfile.statusBadge()).toBe(active);

  await surface.signIn(persona.vendor);
  await surface.userProfileSelf.open();
  await surface.userProfileSelf.deactivateAccount();
  await surface.userProfileSelf.confirmActivationChange();

  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.vendorOne.id });
  expect(await surface.userProfile.statusBadge()).not.toBe(active);
}

async function signInAgain(surface: Surface): Promise<void> {
  await surface.userSignIn.open();
  await surface.userSignIn.signInAsVendor(persona.vendor);
}

test("a person who deactivated their own account is let back in the next time they sign in", async ({ surface }) => {
  await deactivateOwnAccount(surface);
  await surface.signOut();

  await signInAgain(surface);

  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.signInRequired()).toBeFalsy();
  expect(await surface.userProfileSelf.idpUsernameReadonly()).toContain(seed.users.vendorOne.idp_id);
});

test("their account becomes active again", async ({ surface }) => {
  await deactivateOwnAccount(surface);
  await surface.signOut();

  await signInAgain(surface);

  await surface.signIn(persona.administrator);
  const active = await activeReading(surface);
  await surface.userProfile.open({ userId: seed.users.vendorOne.id });
  expect(await surface.userProfile.statusBadge()).toBe(active);
});

// The catcher is cleared after the deactivation, so the message found is the one the return
// produced and not the one the departure produced. That it says the account was reactivated
// is read from the subject and the leading excerpt the catcher lists.
test("they are told by email that it has been reactivated", async ({ surface, mail }) => {
  await deactivateOwnAccount(surface);
  await surface.signOut();
  await mail.clear();

  await signInAgain(surface);

  await expect
    .poll(
      async () =>
        (await mail.messagesTo(seed.users.vendorOne.email)).some((message) =>
          `${message.Subject} ${message.Snippet}`.toLowerCase().includes("reactivated"),
        ),
      { timeout: 10000 },
    )
    .toBe(true);
});
