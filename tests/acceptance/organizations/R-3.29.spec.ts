// criterion: @R-3.29 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("a registered vendor who is invited to an organization receives a message naming the organization", async ({
  surface,
  mail,
}) => {
  await mail.clear();

  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.withPendingInvitation.id });
  await surface.organizationEdit.addTeamMembers({ emails: [seed.users.fileUploader.email] });

  const messages = await mail.messagesTo(seed.users.fileUploader.email);
  expect(messages.length).toBeGreaterThan(0);

  const text = messages.map((message) => `${message.Subject} ${message.Snippet}`).join(" ");
  expect(text).toContain(seed.organizations.withPendingInvitation.legal_name);
});
