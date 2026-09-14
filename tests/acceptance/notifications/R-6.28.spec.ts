// criterion: @R-6.28 v1
// provenance: blind, spec@d4b7ad71f09fd800088a439d26222d352e4e30dc, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// The announcement of changed terms goes to every active vendor, and seed.users.vendorWithoutEmail
// is an active vendor holding no address. Whatever order the service takes them in, every active
// vendor who does hold an address must still be reached, which cannot happen if the run stops at
// the one it cannot address.
//
// Two parts of the statement are not asserted. Skipping the addressless vendor and composing a
// message addressed to nobody leave the same trace: a message with no recipient never reaches the
// catcher, and the service records nothing about who it did not reach, so the difference shows
// only in its operational log. And a recipient that can be addressed but not reached cannot be
// produced: nothing in the surface or the mail fixture makes a single delivery fail.
test("The service skips a recipient that holds no email address rather than composing a message addressed to nobody, and a broadcast to many people always continues past a recipient it cannot address or cannot reach.", async ({
  surface,
  mail,
}) => {
  const addressableActiveVendors = Object.values(seed.users).flatMap((user) =>
    user.account_type === "VENDOR" && !("status" in user) && user.email ? [user.email] : [],
  );
  const before = await Promise.all(
    addressableActiveVendors.map(async (address) => (await mail.messagesTo(address)).length),
  );

  await surface.signIn(persona.administrator);
  await surface.notificationTermsBroadcast.open();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();
  expect(await surface.notificationTermsBroadcast.notifyVendorsSuccess()).toBeTruthy();

  for (const [i, address] of addressableActiveVendors.entries()) {
    await expect
      .poll(async () => (await mail.messagesTo(address)).length, { timeout: 15000 })
      .toBeGreaterThan(before[i]);
  }
});
