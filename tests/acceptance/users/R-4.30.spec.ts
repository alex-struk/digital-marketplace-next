// criterion: @R-4.30 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona, seed } from "../../fixtures";

// Neither the recorded date nor the identity of the administrator who deactivated the
// account is returned by any observation. What the surface can tell is that the account
// carries the form of inactivity only an administrator's deactivation produces, which is
// the one that offers a reactivation control (R-4.19). Each test reactivates the account
// afterwards, so it is left as it was found.
test("an administrator may deactivate another person's account, and the account is marked as deactivated by an administrator", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ user: seed.users.vendorOne.id });
  const whileActive = await surface.userProfile.statusBadge();

  await surface.userProfile.deactivateAccount();
  expect(await surface.userProfile.activationModal()).toBeTruthy();
  await surface.userProfile.confirmActivationChange();

  await surface.userProfile.open({ user: seed.users.vendorOne.id });
  expect(await surface.userProfile.statusBadge()).not.toBe(whileActive);
  expect(await surface.userProfile.profileTab()).toContain("Reactivate");

  await surface.userProfile.reactivateAccount();
  await surface.userProfile.confirmActivationChange();
});

// The message says an administrator has removed their access and whom to contact with
// questions. That wording is body content, which the mail fixture does not return, so what
// is asserted is that the deactivation put a message in front of that person.
test("the person is told by email", async ({ surface, mail }) => {
  await mail.clear();

  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ user: seed.users.vendorOne.id });
  await surface.userProfile.deactivateAccount();
  await surface.userProfile.confirmActivationChange();

  await expect
    .poll(async () => (await mail.messagesTo(seed.users.vendorOne.email)).length, { timeout: 10000 })
    .toBeGreaterThan(0);

  await surface.userProfile.open({ user: seed.users.vendorOne.id });
  await surface.userProfile.reactivateAccount();
  await surface.userProfile.confirmActivationChange();
});
