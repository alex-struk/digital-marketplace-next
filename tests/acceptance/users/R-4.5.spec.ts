// criterion: @R-4.5 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("a person who deactivated their own account is let back in the next time they sign in, and their account becomes active again", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.userProfile.open({ userId: "me" });
  await surface.userProfile.deactivateAccount();
  await surface.userProfile.confirmActivationChange();

  await surface.signIn(persona.vendor);
  await surface.userProfile.open({ userId: "me" });
  expect(await surface.userProfile.emailField()).toContain(seed.users.vendorOne.email);

  // An account's status is shown only to an administrator, and the badge of an account
  // known to be active is what "active once more" has to be measured against.
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.organizationOwner.id });
  const knownActive = await surface.userProfile.statusBadge();
  await surface.userProfile.open({ userId: seed.users.vendorOne.id });
  expect(await surface.userProfile.statusBadge()).toBe(knownActive);
});

test("they are told by email that it has been reactivated", async ({ surface, mail }) => {
  await surface.signIn(persona.vendor);
  await surface.userProfile.open({ userId: "me" });
  await surface.userProfile.deactivateAccount();
  await surface.userProfile.confirmActivationChange();

  await mail.clear();
  await surface.signIn(persona.vendor);

  const messages = await mail.messagesTo(seed.users.vendorOne.email);
  expect(messages.some((message) => /reactivat/i.test(`${message.Subject} ${message.Snippet}`))).toBe(true);
});
