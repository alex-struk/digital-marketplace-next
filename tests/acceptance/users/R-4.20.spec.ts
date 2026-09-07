// criterion: @R-4.20 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("a person whose account an administrator reactivates is told that an administrator has reactivated their Digital Marketplace account and whom to contact with questions", async ({
  surface,
  mail,
}) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.organizationAdmin.id });
  await surface.userProfile.deactivateAccount();
  await surface.userProfile.confirmActivationChange();

  await mail.clear();
  await surface.userProfile.reactivateAccount();
  await surface.userProfile.confirmActivationChange();

  const messages = await mail.messagesTo(seed.users.organizationAdmin.email);
  const reactivation = messages.find((message) => /reactivat/i.test(`${message.Subject} ${message.Snippet}`));
  expect(reactivation).toBeTruthy();
  expect(`${reactivation?.Subject} ${reactivation?.Snippet}`).toMatch(/administrator/i);
  expect(`${reactivation?.Subject} ${reactivation?.Snippet}`).not.toMatch(/you have successfully reactivated/i);
});

test("the message telling a person they reactivated the account themselves is sent only when they did so by signing in again", async ({
  surface,
  mail,
}) => {
  await surface.signIn(persona.vendor);
  await surface.userProfile.open({ userId: "me" });
  await surface.userProfile.deactivateAccount();
  await surface.userProfile.confirmActivationChange();

  await mail.clear();
  await surface.signIn(persona.vendor);

  const messages = await mail.messagesTo(seed.users.vendorOne.email);
  expect(
    messages.some((message) => /you have successfully reactivated/i.test(`${message.Subject} ${message.Snippet}`)),
  ).toBe(true);
});
