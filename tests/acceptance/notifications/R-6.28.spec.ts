// criterion: @R-6.28 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-13
import { test, expect, persona, seed } from "../../fixtures";

// The broadcast of changed terms is sent to every active vendor, and among them is
// seed.users.vendorWithoutEmail, which holds no address. Whatever order the service takes them
// in, every addressable vendor must still be reached.
//
// Two parts are not asserted. That the service skips such a recipient rather than composing a
// message addressed to nobody would need the whole contents of the catcher, and the mail
// fixture searches only by an address. And a recipient the service can address but cannot
// reach cannot be produced: nothing in the surface or the fixture makes one delivery fail.
test("the service skips a recipient that holds no email address rather than composing a message addressed to nobody, and a broadcast to many people always continues past a recipient it cannot address or cannot reach", async ({
  surface,
  mail,
}) => {
  const addressableVendors = [
    seed.users.vendorOne.email,
    seed.users.organizationOwner.email,
    seed.users.organizationAdmin.email,
    seed.users.organizationMember.email,
    seed.users.fileUploader.email,
    seed.users.vendorWithNoticesOff.email,
    seed.users.proponentTwo.email,
    seed.users.proponentThree.email,
  ];
  const before = await Promise.all(addressableVendors.map(async (address) => (await mail.messagesTo(address)).length));

  await surface.signIn(persona.administrator);
  await surface.notificationTermsBroadcast.open();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();

  for (const [i, address] of addressableVendors.entries()) {
    await expect
      .poll(async () => (await mail.messagesTo(address)).length, { timeout: 10000 })
      .toBeGreaterThan(before[i]);
  }
});
