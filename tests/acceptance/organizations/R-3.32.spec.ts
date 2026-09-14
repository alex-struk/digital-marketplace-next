// criterion: @R-3.32 v1
// provenance: blind, spec@1c3743e9fb53c29de89a28045222abab29c5e27e, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// The seeded pending invitation is the criterion's given: the invited vendor has been
// invited to this organization and has not answered.
const organization = seed.organizations.withPendingInvitation;
const invited = seed.users.invitedVendor;
const owner = seed.users.organizationOwner;

test("when a person with a pending invitation declines it, the pending membership is gone from the organization's team list and the owner receives a message saying the person rejected the team request", async ({
  surface,
  mail,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  expect(await surface.organizationEdit.teamMemberRow()).toContain(invited.email);

  // Cleared once the given is confirmed, so what arrives is the consequence of the decline.
  await mail.clear();

  await surface.signIn(persona.invitedVendor);
  await surface.organizationUserMembershipsSelf.open();
  await surface.organizationUserMembershipsSelf.rejectInvitation({ organization: organization.legal_name });

  await expect
    .poll(
      async () =>
        (await mail.messagesTo(owner.email)).map((message) => `${message.Subject} ${message.Snippet}`).join(" "),
      { timeout: 10000 },
    )
    .toMatch(/reject/i);

  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  expect(await surface.organizationEdit.teamMemberRow()).not.toContain(invited.email);
});
