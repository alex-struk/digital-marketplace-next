// criterion: @R-6.28 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// The broadcast below has among its recipients seed.users.vendorWithoutEmail, which holds
// no address, and seed.users.vendorDeactivated, which is not told at all. Every other
// active vendor must still be reached. The first half of the criterion — that the service
// skips such a recipient rather than composing a message addressed to nobody — is not
// asserted: reading it needs the whole contents of the catcher, and the mail fixture can
// only search by a recipient address.
test("the service skips a recipient that holds no email address, and a broadcast to many people always continues past a recipient it cannot address or cannot reach", async ({
  surface,
  mail,
}) => {
  await mail.clear();

  await surface.signIn(persona.administrator);
  await surface.notificationTermsBroadcast.open();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();

  const addressableVendors = [
    seed.users.vendorOne.email,
    seed.users.organizationOwner.email,
    seed.users.organizationAdmin.email,
    seed.users.organizationMember.email,
    seed.users.fileUploader.email,
    seed.users.invitedVendor.email,
    seed.users.vendorWithNoticesOff.email,
    seed.users.vendorWithTermsReset.email,
  ];

  for (const address of addressableVendors) {
    await expect
      .poll(async () => (await mail.messagesTo(address)).length, { timeout: 10000 })
      .toBeGreaterThan(0);
  }
});
