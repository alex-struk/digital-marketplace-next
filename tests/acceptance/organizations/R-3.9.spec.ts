// criterion: @R-3.9 v2
// provenance: blind, spec@0518dccea59a1ad5bce1f3b3ed4a00d0c8c61c73, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The target is put back to its seed before every test, so each scenario starts from the
// invitation the seed leaves pending: seed.affiliations.pendingInvitation is
// seed.users.invitedVendor's unanswered invitation to seed.organizations.withPendingInvitation,
// whose owner is seed.users.organizationOwner.

const invitation = seed.affiliations.pendingInvitation;
const invitedTo = seed.organizations.withPendingInvitation;

// An observation that is not on the page reads as absent.
function orAbsent(read: () => Promise<string>): () => Promise<string> {
  return () => read().catch(() => "");
}

async function acceptByRequest(surface: Surface): Promise<void> {
  await surface.affiliationApprovalRequest.open({ affiliationId: invitation.id });
  await surface.affiliationApprovalRequest.acceptMembershipByRequest();
}

async function expectInvitedPersonsMembership(surface: Surface, pending: boolean): Promise<void> {
  await surface.organizationUserMembershipsSelf.open();
  await expect
    .poll(() => surface.organizationUserMembershipsSelf.affiliatedOrganizationsTable())
    .toContain(invitedTo.legal_name);
  const badge = expect.poll(orAbsent(() => surface.organizationUserMembershipsSelf.pendingBadge()));
  if (pending) await badge.toBeTruthy();
  else await badge.toBeFalsy();
}

test("the organization's owner cannot accept a pending invitation on the invited person's behalf", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await acceptByRequest(surface);

  expect(await orAbsent(() => surface.affiliationApprovalRequest.refusalMessages())()).toBeTruthy();
  expect(await orAbsent(() => surface.affiliationApprovalRequest.requestAccepted())()).toBeFalsy();

  // Nothing was accepted: the invited person still sees the invitation as pending.
  await surface.signIn(persona.invitedVendor);
  await expectInvitedPersonsMembership(surface, true);
});

test("a pending invitation becomes an active membership when the invited person accepts it", async ({ surface }) => {
  await surface.signIn(persona.invitedVendor);
  await surface.organizationUserMembershipsSelf.open();
  await surface.organizationUserMembershipsSelf.approveInvitation({ organization: invitedTo.legal_name });

  await expectInvitedPersonsMembership(surface, false);
});

test("an invitation that is not pending cannot be accepted", async ({ surface }) => {
  // The invited person accepts; the membership becomes active.
  await surface.signIn(persona.invitedVendor);
  await acceptByRequest(surface);
  expect(await surface.affiliationApprovalRequest.requestAccepted()).toBeTruthy();
  expect(await surface.affiliationApprovalRequest.membershipStatus()).toBe("ACTIVE");

  // A further attempt to accept the now-active membership is refused as not pending.
  await acceptByRequest(surface);
  expect(await orAbsent(() => surface.affiliationApprovalRequest.requestAccepted())()).toBeFalsy();
  expect(await surface.affiliationApprovalRequest.refusalMessages()).toMatch(/not pending/i);

  // The membership is unchanged: still the invited person's, still active.
  await expectInvitedPersonsMembership(surface, false);
});
