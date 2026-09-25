// criterion: @R-4.5 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";

// persona.selfReactivatingVendor is seed.users.vendorReturning, kept apart so that deactivating
// it disturbs nobody else, and both of its sign-ins go through the identity provider. The
// account is deactivated from the person's own profile; the catcher is emptied only after
// that, so the message deactivating it leaves behind is not mistaken for the one that follows.
// The reactivation message is told apart by the wording the criterion's outcome gives it.

const returning = seed.users.vendorReturning;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

test("a person who deactivated their own account is let back in the next time they sign in, their account becomes active again, and they are told by email that it has been reactivated", async ({
  surface,
  mail,
}) => {
  await surface.signIn(persona.selfReactivatingVendor);
  await surface.userProfileSelf.open();
  await surface.userProfileSelf.deactivateAccount();
  await surface.userProfileSelf.confirmActivationChange();
  expect(await surface.userNotice.deactivatedOwnAccountNotice()).toBeTruthy();

  await mail.clear();
  await surface.signIn(persona.selfReactivatingVendor);

  await surface.userProfileSelf.open();
  expect(await readOrEmpty(() => surface.userProfileSelf.signInRequired())).toBeFalsy();
  expect(await surface.userProfileSelf.userIdentifier()).toBe(returning.id);
  const status = await surface.userProfileSelf.statusBadge();
  expect(status).toMatch(/active/i);
  expect(status).not.toMatch(/inactive|deactivated/i);

  await expect
    .poll(async () => (await mail.messagesTo(returning.email!)).length, { timeout: 10000, message: "no message reached the returning person" })
    .toBeGreaterThan(0);
  const [message] = await mail.messagesTo(returning.email!);
  await surface.caughtMessage.open({ messageId: message.ID });
  expect(await surface.caughtMessage.plainTextBody()).toMatch(/successfully reactivated/i);
});
