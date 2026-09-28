// criterion: @R-3.31 v1
// provenance: blind, spec@c1e09955fdff55e84870c25dfcb8e0fd9981c437, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";

// The given is a person with a pending invitation to an organization: the seed's organization
// whose owner has invited seed.users.invitedVendor.
const organization = seed.organizations.withPendingInvitation;
const owner = seed.users.organizationOwner;
const invited = seed.users.invitedVendor;

test("when a person accepts an invitation, the organization's owner is told they have joined and the new member is told they may now be put forward on the organization's proposals", async ({
  surface,
  mail,
}) => {
  // Cleared before the acceptance, so whatever arrives afterwards is its consequence.
  await mail.clear();

  await surface.signIn(persona.invitedVendor);
  await surface.organizationUserMembershipsSelf.open();
  await surface.organizationUserMembershipsSelf.approveInvitation({ organization: organization.legal_name });

  // The messages may be sent just after the acceptance returns, so each mailbox is waited on
  // for a bounded time before either message is concluded missing.
  await expect
    .poll(
      async () => ({
        toOwner: (await mail.messagesTo(owner.email)).length > 0,
        toMember: (await mail.messagesTo(invited.email)).length > 0,
      }),
      { timeout: 30_000 },
    )
    .toEqual({ toOwner: true, toMember: true });
});
