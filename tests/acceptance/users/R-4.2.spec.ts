// criterion: @R-4.2 v1
// provenance: blind, spec@658792c3c7c79540af12cf18a97a260fc2484f16, derived 2026-10-04
import { test, expect, persona } from "../../fixtures";

// A welcome message is told apart from every other message the catcher holds by its subject:
// a first sign-in can bring other mail with it (notices other criteria require), so neither
// half counts messages — each looks only for one that welcomes the person.
const WELCOME = /welcome/i;

test("a person whose account has just been created is sent a welcome message", async ({ surface, mail }) => {
  await mail.clear();
  await surface.signIn(persona.firstTimeVendor);

  // The address the identity provider shared is not stated in the contract, so it is read off
  // the new account's own profile.
  await surface.userProfileSelf.open();
  const address = await surface.userProfileSelf.emailField();
  expect(address).toBeTruthy();

  const welcomes = async () => (await mail.messagesTo(address)).filter((m) => WELCOME.test(m.Subject));
  await expect
    .poll(async () => (await welcomes()).length, { timeout: 10000, message: "no welcome message reached the new account's address" })
    .toBeGreaterThan(0);
  const [message] = await welcomes();

  await surface.caughtMessage.open({ messageId: message.ID });
  expect(await surface.caughtMessage.linksInBody()).toMatch(/sign.?in/i);
});

test("a person whose account has just been created is not sent a welcome message when no email address is known for them", async ({
  surface,
  mail,
}) => {
  await mail.clear();
  await surface.signIn(persona.firstTimeVendorWithoutEmail);

  // The account exists: the person's own profile names it.
  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.userIdentifier()).toBeTruthy();

  // Give a welcome message the same time the first half allows it to arrive, then look for one.
  await new Promise((resolve) => setTimeout(resolve, 10000));
  await surface.caughtMessageList.open();
  expect(await surface.caughtMessageList.messageSubjects()).not.toMatch(WELCOME);
});
