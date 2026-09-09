// criterion: @R-4.5 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona, seed } from "../../fixtures";

// A self-deactivated account is made by the test rather than seeded: the vendor deactivates
// their own account, which is the only thing that produces the owner-deactivated form of
// inactivity. An account's status is stated only to an administrator, so the change from
// active to inactive and back is read from the administrator's view of the same profile,
// relative to how it read while the account was active.
test("a person who deactivated their own account is let back in the next time they sign in, and their account becomes active again", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ user: seed.users.vendorOne.id });
  const whileActive = await surface.userProfile.statusBadge();

  await surface.signIn(persona.vendor);
  await surface.userProfile.open();
  await surface.userProfile.deactivateAccount();
  await surface.userProfile.confirmActivationChange();

  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ user: seed.users.vendorOne.id });
  expect(await surface.userProfile.statusBadge()).not.toBe(whileActive);

  await surface.signIn(persona.vendor);
  await surface.userProfile.open();
  expect(await surface.userProfile.idpUsernameReadonly()).toContain(seed.users.vendorOne.idp_id);

  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ user: seed.users.vendorOne.id });
  expect(await surface.userProfile.statusBadge()).toBe(whileActive);
});

// The catcher is cleared after the deactivation, so the message counted below is the one
// the return produced and not the one the departure produced. Its wording — that the
// account has been reactivated — is body content, which the mail fixture does not return.
test("they are told by email that it has been reactivated", async ({ surface, mail }) => {
  await surface.signIn(persona.vendor);
  await surface.userProfile.open();
  await surface.userProfile.deactivateAccount();
  await surface.userProfile.confirmActivationChange();

  await mail.clear();

  await surface.signIn(persona.vendor);

  await expect
    .poll(async () => (await mail.messagesTo(seed.users.vendorOne.email)).length, { timeout: 10000 })
    .toBeGreaterThan(0);
});
