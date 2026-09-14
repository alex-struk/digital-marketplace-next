// criterion: @R-6.23 v1
// provenance: blind, spec@d4b7ad71f09fd800088a439d26222d352e4e30dc, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// The given is a mix of active and deactivated vendors who had all accepted the terms in force.
// The seed is applied once and any other announcement in the same run withdraws acceptance too,
// so each active vendor here first agrees to the current terms through their own legal settings.
// The deactivated vendor cannot sign in, so their standing is read by the administrator from that
// vendor's legal settings instead.
//
// That the message names the change and links to the new terms is body content. The mail fixture
// returns only a subject, a snippet, a recipient and an identifier, and the contract names no
// wording to look for, so what is asserted is that a further message reached each active vendor
// and none reached the deactivated one.
test("An administrator viewing the service's terms and conditions can announce that they have changed, which withdraws every vendor's standing acceptance and sends each active vendor a message asking them to read and accept the new terms.", async ({
  surface,
  mail,
}) => {
  const activeVendors = [
    { persona: persona.vendor, email: seed.users.vendorOne.email },
    { persona: persona.organizationOwner, email: seed.users.organizationOwner.email },
  ];
  const deactivatedVendor = seed.users.vendorDeactivated;

  for (const vendor of activeVendors) {
    await surface.signIn(vendor.persona);
    await surface.userProfileSelfLegal.open();
    if (await surface.userProfileSelfLegal.termsUpdatedWarning()) {
      await surface.userProfileSelfLegal.acceptUpdatedTerms();
      await surface.userProfileSelfLegal.confirmAcceptUpdatedTerms();
      await surface.userProfileSelfLegal.open();
    }
    expect(await surface.userProfileSelfLegal.termsUpdatedWarning()).toBeFalsy();
    await surface.signOut();
  }

  const before = await Promise.all(activeVendors.map(async (v) => (await mail.messagesTo(v.email)).length));
  const deactivatedBefore = (await mail.messagesTo(deactivatedVendor.email)).length;

  await surface.signIn(persona.administrator);
  await surface.notificationTermsBroadcast.open();
  expect(await surface.notificationTermsBroadcast.notifyVendorsControl()).toBeTruthy();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  expect(await surface.notificationTermsBroadcast.notifyVendorsConfirmation()).toBeTruthy();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();
  expect(await surface.notificationTermsBroadcast.notifyVendorsSuccess()).toBeTruthy();

  for (const [i, vendor] of activeVendors.entries()) {
    await expect
      .poll(async () => (await mail.messagesTo(vendor.email)).length, { timeout: 15000 })
      .toBeGreaterThan(before[i]);
  }
  // Read only once every active vendor's message has arrived, so the catcher is known to be
  // receiving and an absence here is the service's decision.
  expect((await mail.messagesTo(deactivatedVendor.email)).length).toBe(deactivatedBefore);

  await surface.userProfileLegal.open({ userId: deactivatedVendor.id });
  expect(await surface.userProfileLegal.termsUpdatedWarning()).toBeTruthy();
  await surface.signOut();

  for (const vendor of activeVendors) {
    await surface.signIn(vendor.persona);
    await surface.userProfileSelfLegal.open();
    expect(await surface.userProfileSelfLegal.termsUpdatedWarning()).toBeTruthy();
    await surface.signOut();
  }
});
