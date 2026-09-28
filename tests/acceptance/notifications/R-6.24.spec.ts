// criterion: @R-6.24 v1
// provenance: blind, spec@f31700e000484947669c48e50cf9c73b4d1e20c7, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";

// What this adds to R-6.23 is ordering: success is reported before any message is sent. Ordinarily
// messages reach the catcher within a second, so reading the catcher when success appears would be a
// race. The given is therefore made with mail-delivery-delay.slow_delivery (observables.yaml,
// email.delivery_delay): while it is in force no message can reach the catcher sooner than nine
// seconds after the service starts sending it, so success read at once with the catcher still
// empty is success reported before delivery. The delay outlives the test unless lifted, so it is
// lifted in a finally, pass or fail.
//
// The "large body of vendors" is the seed's own vendors. Once the delay is lifted the messages must
// still arrive — they were being sent in the background, not dropped — and the administrator's
// page must still show no report about them either way. That the acceptances were withdrawn
// before the answer is read on a vendor's own legal settings, where a standing acceptance before
// the announcement becomes a warning of changed terms after it.

const settle = { timeout: 30000 };
const vendor = seed.users.vendorOne;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

test("An announcement of changed terms is reported as successful as soon as the acceptances are withdrawn, before any message has been sent.", async ({
  surface,
  mail,
}) => {
  test.slow();

  // The vendor holds a standing acceptance before the announcement.
  await surface.signIn(persona.vendor);
  await surface.userProfileSelfLegal.open();
  expect(await readOrEmpty(() => surface.userProfileSelfLegal.acceptedOnNotice()), "a standing acceptance").toBeTruthy();
  expect(await readOrEmpty(() => surface.userProfileSelfLegal.termsUpdatedWarning()), "not already warned").toBeFalsy();
  await surface.signOut();

  await mail.clear();
  await surface.caughtMessageList.open();
  expect(Number(await surface.caughtMessageList.messageCount()), "the catcher starts empty").toBe(0);

  await surface.signIn(persona.administrator);
  await surface.notificationTermsBroadcast.open();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  expect(await surface.notificationTermsBroadcast.notifyVendorsConfirmation()).toBeTruthy();

  let success = "";
  let countAtSuccess = -1;
  try {
    await surface.mailDeliveryDelay.open();
    await surface.mailDeliveryDelay.slowDelivery();
    const slowed = (await readOrEmpty(() => surface.mailDeliveryDelay.deliverySlowed())).trim();
    expect(slowed, "the delay is in force").toBeTruthy();
    expect(slowed, "the delay is in force").not.toMatch(/^(false|no|0|off)$/i);

    // The when: the administrator confirms, and is told at once that vendors have been notified.
    await surface.notificationTermsBroadcast.confirmNotifyVendors();
    await expect.poll(() => readOrEmpty(() => surface.notificationTermsBroadcast.notifyVendorsSuccess()), { timeout: 5000 }).toBeTruthy();
    success = await surface.notificationTermsBroadcast.notifyVendorsSuccess();
    await surface.caughtMessageList.open();
    countAtSuccess = Number(await surface.caughtMessageList.messageCount());
  } finally {
    await surface.mailDeliveryDelay.open();
    await surface.mailDeliveryDelay.restoreDeliverySpeed();
  }

  expect(success, "success reported").toBeTruthy();
  expect(countAtSuccess, "messages that had arrived when success was reported").toBe(0);

  // The messages were still on their way: once the delay is lifted they arrive.
  await expect.poll(async () => (await mail.messagesTo(vendor.email)).length, settle).toBeGreaterThan(0);

  // Nothing later tells the administrator whether every message was sent.
  await surface.notificationTermsBroadcast.open();
  expect(await readOrEmpty(() => surface.notificationTermsBroadcast.notifyVendorsFailure()), "a later report on delivery").toBeFalsy();
  await surface.signOut();

  // The acceptance was withdrawn as part of the answer.
  await surface.signIn(persona.vendor);
  await surface.userProfileSelfLegal.open();
  expect(await readOrEmpty(() => surface.userProfileSelfLegal.termsUpdatedWarning()), "acceptance withdrawn").toBeTruthy();
});
