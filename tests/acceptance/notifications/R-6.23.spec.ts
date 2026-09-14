// criterion: @R-6.23 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// The withdrawn acceptance is what a vendor meets on their next visit, so it is read from two
// vendors' own legal settings after the announcement. That the message asks them to read and
// accept the new terms is body content, which the mail fixture does not return; what is
// asserted is that a message reached each of those vendors.
test("an administrator viewing the service's terms and conditions can announce that they have changed, which withdraws every vendor's standing acceptance and sends each active vendor a message asking them to read and accept the new terms", async ({
  surface,
  mail,
}) => {
  const vendors = [
    { persona: persona.vendor, email: seed.users.vendorOne.email },
    { persona: persona.organizationOwner, email: seed.users.organizationOwner.email },
  ];
  const before = await Promise.all(vendors.map(async (v) => (await mail.messagesTo(v.email)).length));

  await surface.signIn(persona.administrator);
  await surface.notificationTermsBroadcast.open();
  expect(await surface.notificationTermsBroadcast.notifyVendorsControl()).toBeTruthy();

  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  expect(await surface.notificationTermsBroadcast.notifyVendorsConfirmation()).toBeTruthy();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();

  for (const [i, vendor] of vendors.entries()) {
    await expect
      .poll(async () => (await mail.messagesTo(vendor.email)).length, { timeout: 10000 })
      .toBeGreaterThan(before[i]);
  }
  await surface.signOut();

  for (const vendor of vendors) {
    await surface.signIn(vendor.persona);
    await surface.userProfileSelfLegal.open();
    expect(await surface.userProfileSelfLegal.termsUpdatedWarning()).toBeTruthy();
    await surface.signOut();
  }
});
