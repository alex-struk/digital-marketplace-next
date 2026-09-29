// criterion: @R-3.24 v1
// provenance: blind, spec@258c8b6542d73fd923b7fbc7b8c8d9d82627255b, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";

// Mail is delivered some time after the archive action returns, so neither case reads the
// mailbox once: the positive case polls until an archiving message arrives within the
// settling window, and the negative case watches the mailbox for that whole window before
// concluding that nothing arrived.
const settleMs = 30000;

type Mailbox = { messagesTo(address: string): Promise<Array<{ Subject: string; Snippet: string }>> };

async function archivingMessagesTo(mail: Mailbox, address: string): Promise<number> {
  const messages = await mail.messagesTo(address);
  return messages.filter((message) => /archiv/i.test(`${message.Subject} ${message.Snippet}`)).length;
}

test("When an administrator archives an organization they do not own, its owner is told by email that the organization has been archived.", async ({
  surface,
  mail,
}) => {
  // The given: an active organization owned by a vendor (not by the administrator).
  const organization = seed.organizations.unqualified;
  const owner = seed.users.vendorOne;

  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: organization.id });
  await mail.clear();
  await surface.organizationEdit.archiveOrganization();

  await expect
    .poll(() => archivingMessagesTo(mail, owner.email), { timeout: settleMs })
    .toBeGreaterThan(0);
});

test("No such message is sent when the owner archives their own organization.", async ({ surface, mail }) => {
  const organization = seed.organizations.withPendingInvitation;
  const owner = seed.users.organizationOwner;

  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  await mail.clear();
  await surface.organizationEdit.archiveOrganization();

  // Wait out the same settling window the positive case allows, checking throughout, so a
  // notice that would arrive late is still caught.
  const deadline = Date.now() + settleMs;
  let seen = 0;
  while (Date.now() < deadline) {
    seen = await archivingMessagesTo(mail, owner.email);
    if (seen > 0) break;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  expect(seen).toBe(0);
});
