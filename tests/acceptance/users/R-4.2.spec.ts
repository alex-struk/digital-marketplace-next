// criterion: @R-4.2 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona } from "../../fixtures";

// The address a first-time person's identity supplies is not stated in the contract, so it is
// read off their own profile once the account exists, and the welcome message is looked for
// under it in the mail catcher and opened by the catcher's identifier for it.
//
// A person with no address has no address to search by, so the withheld half reads every
// message the catcher holds: it is emptied before the first sign-in, and after the account is
// seen to exist nothing may have arrived for anyone.

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

test("a person whose account has just been created is sent a welcome message", async ({ surface, mail }) => {
  await mail.clear();
  await surface.signIn(persona.firstTimeVendor);

  await surface.userProfileSelf.open();
  const address = await surface.userProfileSelf.emailField();
  expect(address).toBeTruthy();

  await expect
    .poll(async () => (await mail.messagesTo(address)).length, { timeout: 10000, message: "no message reached the new account's address" })
    .toBeGreaterThan(0);
  const [message] = await mail.messagesTo(address);

  await surface.caughtMessage.open({ messageId: message.ID });
  const text = `${await surface.caughtMessage.subject()}\n${await surface.caughtMessage.plainTextBody()}`;
  expect(text).toMatch(/welcome/i);
  expect(await surface.caughtMessage.linksInBody()).toMatch(/sign.?in/i);
});

test("a person whose account has just been created is not sent a welcome message when no email address is known for them", async ({
  surface,
  mail,
}) => {
  await mail.clear();
  await surface.signIn(persona.firstTimeVendorWithoutEmail);

  await surface.userProfileSelf.open();
  expect(await readOrEmpty(() => surface.userProfileSelf.signInRequired())).toBeFalsy();
  expect(await surface.userProfileSelf.userIdentifier()).toBeTruthy();
  expect(await readOrEmpty(() => surface.userProfileSelf.emailField())).toBeFalsy();

  await surface.caughtMessageList.open();
  expect(Number(await surface.caughtMessageList.messageCount())).toBe(0);
});
