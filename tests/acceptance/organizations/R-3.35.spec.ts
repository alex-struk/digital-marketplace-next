// criterion: @R-3.35 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The part of the mail fixture this test reads.
type Mail = {
  clear(): Promise<void>;
  messagesTo(address: string): Promise<Array<{ ID: string }>>;
};

// The invited person is seed.users.vendorOne (signed in as persona.vendor), a registered vendor
// who belongs to the seed's qualified organization in no way; that organization's owner
// invites them from its team screen. The message is found in the mail catcher by its recipient
// and opened by the catcher's own identifier for it, and each choice is followed from there
// with the invited person signed in, as they would be when they open it.
const organization = seed.organizations.qualified;
const invited = seed.users.vendorOne;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function invitationMessage(surface: Surface, mail: Mail): Promise<string> {
  await mail.clear();
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  await surface.organizationEdit.addTeamMembers({ emails: [invited.email!] });

  await expect
    .poll(async () => (await mail.messagesTo(invited.email!)).length, { timeout: 10000, message: "no invitation reached the invited person" })
    .toBeGreaterThan(0);
  const [message] = await mail.messagesTo(invited.email!);
  return message.ID;
}

async function followChoice(surface: Surface, messageId: string, label: string): Promise<void> {
  await surface.signIn(persona.vendor);
  await surface.caughtMessage.open({ messageId });
  await surface.caughtMessage.followLinkInBody({ label });
}

test("the accept choice offered in an invitation email opens the invited person's own organizations page with the accept confirmation ready", async ({
  surface,
  mail,
}) => {
  const messageId = await invitationMessage(surface, mail);
  await followChoice(surface, messageId, "Accept");

  await expect.poll(() => readOrEmpty(() => surface.organizationUserMembershipsSelf.acceptConfirmation())).toBeTruthy();
  expect(await readOrEmpty(() => surface.organizationUserMembershipsSelf.declineConfirmation())).toBeFalsy();
});

test("the decline choice offered in an invitation email opens the invited person's own organizations page with the decline confirmation ready", async ({
  surface,
  mail,
}) => {
  const messageId = await invitationMessage(surface, mail);
  await followChoice(surface, messageId, "Decline");

  await expect.poll(() => readOrEmpty(() => surface.organizationUserMembershipsSelf.declineConfirmation())).toBeTruthy();
  expect(await readOrEmpty(() => surface.organizationUserMembershipsSelf.acceptConfirmation())).toBeFalsy();
});
