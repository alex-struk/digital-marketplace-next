// criterion: @R-6.28 v1
// provenance: blind, spec@1c3743e9fb53c29de89a28045222abab29c5e27e, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// The broadcast of changed terms goes to every active vendor, and among them is
// seed.users.vendorWithoutEmail, which holds no address. Whatever order the service takes them
// in, the announcement must still be reported as done and every addressable vendor reached.
//
// Two parts are not asserted. Whether the service skips that recipient or composes a message
// addressed to nobody leaves the same trace in the catcher either way, since a message with no
// recipient cannot arrive there; the difference shows only inside the service. And a recipient
// the service can address but cannot reach cannot be produced: every seeded address is one
// the catcher accepts, and nothing in the surface makes one delivery fail.
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
    seed.users.invitedVendor.email,
    seed.users.vendorWithTermsReset.email,
    seed.users.proponentTwo.email,
    seed.users.proponentThree.email,
  ];
  const before = await Promise.all(addressableVendors.map(async (address) => (await mail.messagesTo(address)).length));

  await surface.signIn(persona.administrator);
  await surface.notificationTermsBroadcast.open();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();
  expect(await surface.notificationTermsBroadcast.notifyVendorsSuccess()).toBeTruthy();

  for (const [i, address] of addressableVendors.entries()) {
    await expect
      .poll(async () => (await mail.messagesTo(address)).length, { timeout: 15000 })
      .toBeGreaterThan(before[i]);
  }
});
