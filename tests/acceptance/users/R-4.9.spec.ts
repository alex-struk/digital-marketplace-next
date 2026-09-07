// criterion: @R-4.9 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("a person may deactivate their own account, which ends their session at once", async ({ surface }) => {
  await surface.signIn(persona.fileUploader);
  await surface.userProfile.open({ userId: "me" });
  await surface.userProfile.deactivateAccount();
  await surface.userProfile.confirmActivationChange();

  expect(await surface.userNotice.deactivatedOwnAccountNotice()).toBeTruthy();

  await surface.userProfile.open({ userId: "me" });
  expect(await surface.userSignIn.vendorCard()).toBeTruthy();

  // Signing in again is the only route back for a self-deactivated account (R-4.5).
  await surface.signIn(persona.fileUploader);
});

test("deactivating their own account tells them by email", async ({ surface, mail }) => {
  await mail.clear();

  await surface.signIn(persona.fileUploader);
  await surface.userProfile.open({ userId: "me" });
  await surface.userProfile.deactivateAccount();
  await surface.userProfile.confirmActivationChange();

  const messages = await mail.messagesTo(seed.users.fileUploader.email);
  expect(messages.some((message) => /deactivat/i.test(`${message.Subject} ${message.Snippet}`))).toBe(true);

  await surface.signIn(persona.fileUploader);
});

test("the account is marked as deactivated by them and the record is kept rather than erased", async ({ surface }) => {
  await surface.signIn(persona.fileUploader);
  await surface.userProfile.open({ userId: "me" });
  await surface.userProfile.deactivateAccount();
  await surface.userProfile.confirmActivationChange();

  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.fileUploader.id });
  const deactivatedByThemselves = await surface.userProfile.statusBadge();
  expect(deactivatedByThemselves).toBeTruthy();
  expect(await surface.userProfile.emailField()).toContain(seed.users.fileUploader.email);

  // An account an administrator deactivated is the other kind of inactivity, and the two
  // are distinguished rather than collapsed into one "inactive".
  await surface.userProfile.open({ userId: seed.users.vendorDeactivated.id });
  expect(deactivatedByThemselves).not.toBe(await surface.userProfile.statusBadge());

  await surface.signIn(persona.fileUploader);
});
