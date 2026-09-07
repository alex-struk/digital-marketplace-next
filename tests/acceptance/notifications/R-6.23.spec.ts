// criterion: @R-6.23 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("an administrator viewing the service's terms and conditions can announce that they have changed, which withdraws every vendor's standing acceptance and sends each active vendor a message asking them to read and accept the new terms", async ({
  surface,
  mail,
}) => {
  await mail.clear();

  await surface.signIn(persona.administrator);
  await surface.notificationTermsBroadcast.open();
  expect(await surface.notificationTermsBroadcast.notifyVendorsControl()).toBeTruthy();

  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  expect(await surface.notificationTermsBroadcast.notifyVendorsConfirmation()).toBeTruthy();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();

  expect(await surface.notificationTermsBroadcast.notifyVendorsSuccess()).toBeTruthy();

  // Each active vendor is told.
  await expect
    .poll(async () => (await mail.messagesTo(seed.users.vendorOne.email)).length, { timeout: 10000 })
    .toBeGreaterThan(0);
  await expect
    .poll(async () => (await mail.messagesTo(seed.users.organizationOwner.email)).length, { timeout: 10000 })
    .toBeGreaterThan(0);

  // The standing acceptance is withdrawn, which is what a vendor meets on their next visit.
  await surface.signOut();
  await surface.signIn(persona.vendor);
  await surface.userProfileLegal.open();
  expect(await surface.userProfileLegal.termsUpdatedWarning()).toBeTruthy();
});
