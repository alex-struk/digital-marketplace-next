// criterion: @R-4.30 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("an administrator may deactivate another person's account, which marks it as deactivated by an administrator", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  // The seed carries one account an administrator already deactivated, and its badge is
  // what "deactivated by an administrator" has to be measured against.
  await surface.userProfile.open({ userId: seed.users.vendorDeactivated.id });
  const deactivatedByAdministrator = await surface.userProfile.statusBadge();

  await surface.userProfile.open({ userId: seed.users.fileUploader.id });
  await surface.userProfile.deactivateAccount();
  await surface.userProfile.confirmActivationChange();
  expect(await surface.userProfile.statusBadge()).toBe(deactivatedByAdministrator);

  await surface.userProfile.reactivateAccount();
  await surface.userProfile.confirmActivationChange();
});

test("it tells that person by email that an administrator has removed their access", async ({ surface, mail }) => {
  await surface.signIn(persona.administrator);
  await mail.clear();

  await surface.userProfile.open({ userId: seed.users.fileUploader.id });
  await surface.userProfile.deactivateAccount();
  await surface.userProfile.confirmActivationChange();

  const messages = await mail.messagesTo(seed.users.fileUploader.email);
  const removal = messages.find((message) => /access/i.test(`${message.Subject} ${message.Snippet}`));
  expect(removal).toBeTruthy();
  expect(`${removal?.Subject} ${removal?.Snippet}`).toMatch(/remov/i);

  await surface.userProfile.reactivateAccount();
  await surface.userProfile.confirmActivationChange();
});
