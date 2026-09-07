// criterion: @R-6.26 v2
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// seed.users.vendorWithoutEmail is an active vendor whose account holds no address, so the
// announcement below has one recipient it cannot address. What the criterion says happens
// inside — the message composed all the same and handed over with an empty recipient list,
// the failure written to the operational log only — is not observable from the surface;
// what is observable is that the run reports success and reaches the vendors after it.
test("when the service notifies an account that holds no email address, a broadcast to many vendors always continues to the next recipient because no failure in composing or sending can interrupt it", async ({
  surface,
  mail,
}) => {
  await mail.clear();

  await surface.signIn(persona.administrator);
  await surface.notificationTermsBroadcast.open();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();

  expect(await surface.notificationTermsBroadcast.notifyVendorsSuccess()).toBeTruthy();

  await expect
    .poll(async () => (await mail.messagesTo(seed.users.vendorOne.email)).length, { timeout: 10000 })
    .toBeGreaterThan(0);
  await expect
    .poll(async () => (await mail.messagesTo(seed.users.vendorWithTermsReset.email)).length, { timeout: 10000 })
    .toBeGreaterThan(0);
});
