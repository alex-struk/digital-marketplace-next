// criterion: @R-4.11 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("a person whose account an administrator reactivates is told that they themselves successfully reactivated it", async ({
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
  expect(
    messages.some((message) => /you have successfully reactivated/i.test(`${message.Subject} ${message.Snippet}`)),
  ).toBe(true);
});
