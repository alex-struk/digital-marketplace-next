// criterion: @R-3.31 v1
// provenance: blind, spec@c1e09955fdff55e84870c25dfcb8e0fd9981c437, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";

// The given is a person with a pending invitation to an organization: the seed's organization
// whose owner has invited seed.users.invitedVendor.
const organization = seed.organizations.withPendingInvitation;
const owner = seed.users.organizationOwner;
const invited = seed.users.invitedVendor;

// What the mailbox shows of a message: its subject and the opening of its text.
const readable = (messages: Array<{ Subject: string; Snippet: string }>) =>
  messages.map(({ Subject, Snippet }) => `${Subject}\n${Snippet}`.toLowerCase());

test("when a person accepts an invitation, the organization's owner is told they have joined and the new member is told they may now be put forward on the organization's proposals", async ({
  surface,
  mail,
}) => {
  // Cleared before the acceptance, so whatever arrives afterwards is its consequence.
  await mail.clear();

  await surface.signIn(persona.invitedVendor);

  // The seed gives the invited person no name, so the name the service shows them on their own
  // profile is what the owner's message may identify them by, alongside their email address.
  await surface.userProfileSelf.open();
  const invitedName = (await surface.userProfileSelf.nameField()).trim().toLowerCase();
  const invitedMarks = [invited.email.toLowerCase(), ...(invitedName ? [invitedName] : [])];

  await surface.organizationUserMembershipsSelf.open();
  await surface.organizationUserMembershipsSelf.approveInvitation({ organization: organization.legal_name });

  // The messages may be sent just after the acceptance returns, so each mailbox is waited on
  // for a bounded time before either message is concluded missing or wrong. The owner's message
  // identifies the invited person as having approved the request or joined; the invited person's
  // message names the organization whose team they have joined. No exact sentence is assumed.
  await expect
    .poll(
      async () => ({
        toOwner: readable(await mail.messagesTo(owner.email)).some(
          (text) => invitedMarks.some((mark) => text.includes(mark)) && /approv|join/.test(text),
        ),
        toMember: readable(await mail.messagesTo(invited.email)).some(
          (text) => text.includes(organization.legal_name.toLowerCase()) && /join/.test(text),
        ),
      }),
      { timeout: 30_000 },
    )
    .toEqual({ toOwner: true, toMember: true });
});
