// criterion: @R-3.30 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// No seed handle can stand for "an address that belongs to nobody", so the criterion's
// subject has to be written out; it is on the same example.test domain as the seed.
const unregisteredAddress = "nobody.registered.here@example.test";

test("inviting an email address that no registered account uses creates no pending membership, sends that address an invitation to register, and warns the inviter", async ({
  surface,
  mail,
}) => {
  await mail.clear();

  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.withPendingInvitation.id });
  await surface.organizationEdit.addTeamMembers({ emails: [unregisteredAddress] });

  expect(await surface.organizationEdit.teamMemberRow()).not.toContain(unregisteredAddress);
  expect(await surface.organizationEdit.fieldError()).toContain(unregisteredAddress);

  const messages = await mail.messagesTo(unregisteredAddress);
  expect(messages.length).toBeGreaterThan(0);
});
