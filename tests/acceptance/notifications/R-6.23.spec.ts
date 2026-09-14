// criterion: @R-6.23 v1
// provenance: blind, spec@1c3743e9fb53c29de89a28045222abab29c5e27e, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// The seed holds the mix the given describes: active vendors who accepted the previous terms,
// and seed.users.vendorDeactivated, who accepted them too before being deactivated.
//
// The message is found by each active vendor's own address. That it asks them to read and
// accept the new terms is checked as far as the listing reaches — its subject and the opening
// of its body name the terms — because the mail fixture returns no whole body.
//
// Withdrawal is read where each person meets it: two active vendors on their own legal
// settings, and the deactivated vendor, who cannot act, on their legal settings as the
// administrator opens them.
test("an administrator viewing the service's terms and conditions can announce that they have changed, which withdraws every vendor's standing acceptance and sends each active vendor a message asking them to read and accept the new terms", async ({
  surface,
  mail,
}) => {
  const activeVendors = [
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
  const before = await Promise.all(activeVendors.map(async (address) => (await mail.messagesTo(address)).length));

  await surface.signIn(persona.administrator);
  await surface.notificationTermsBroadcast.open();
  expect(await surface.notificationTermsBroadcast.notifyVendorsControl()).toBeTruthy();

  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  expect(await surface.notificationTermsBroadcast.notifyVendorsConfirmation()).toBeTruthy();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();
  expect(await surface.notificationTermsBroadcast.notifyVendorsSuccess()).toBeTruthy();

  for (const [i, address] of activeVendors.entries()) {
    await expect
      .poll(async () => (await mail.messagesTo(address)).length, { timeout: 15000 })
      .toBeGreaterThan(before[i]);
    const message = await mail.latestTo(address);
    expect(`${message?.Subject ?? ""} ${message?.Snippet ?? ""}`).toMatch(/terms/i);
  }

  await surface.userProfileLegal.open({ userId: seed.users.vendorDeactivated.id });
  expect(await surface.userProfileLegal.termsUpdatedWarning()).toBeTruthy();
  await surface.signOut();

  for (const vendor of [persona.vendor, persona.organizationOwner]) {
    await surface.signIn(vendor);
    await surface.userProfileSelfLegal.open();
    expect(await surface.userProfileSelfLegal.termsUpdatedWarning()).toBeTruthy();
    await surface.signOut();
  }
});
