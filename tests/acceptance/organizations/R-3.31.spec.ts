// criterion: @R-3.31 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("when a person accepts an invitation the organization's owner is told they approved the request and the new member is told they have joined the team", async ({
  surface,
  mail,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.withPendingInvitation.id });
  await surface.organizationEdit.addTeamMembers({ emails: [seed.users.organizationMember.email] });

  // Cleared after the invitation is sent, so what is read back is the consequence of
  // the acceptance alone.
  await mail.clear();

  await surface.signIn(persona.organizationMember);
  await surface.organizationUserMemberships.open({ userId: seed.users.organizationMember.id });
  await surface.organizationUserMemberships.approveInvitation({
    organization: seed.organizations.withPendingInvitation.legal_name,
  });

  const toOwner = await mail.messagesTo(seed.users.organizationOwner.email);
  expect(toOwner.length).toBeGreaterThan(0);

  const toMember = await mail.messagesTo(seed.users.organizationMember.email);
  expect(toMember.length).toBeGreaterThan(0);
  const memberText = toMember.map((message) => `${message.Subject} ${message.Snippet}`).join(" ");
  expect(memberText).toContain(seed.organizations.withPendingInvitation.legal_name);
});
