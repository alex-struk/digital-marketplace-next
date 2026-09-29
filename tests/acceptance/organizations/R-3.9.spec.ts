// criterion: @R-3.9 v1
// provenance: blind, spec@8272c1b989e3bad64c78ae540830a62747dadf42, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The target is put back to its seed before every test, so each scenario starts from the
// invitations the seed leaves pending:
// - seed.affiliations.pendingInvitation is seed.users.invitedVendor's unanswered invitation to
//   seed.organizations.withPendingInvitation, whose owner is seed.users.organizationOwner;
// - seed.users.teamCandidatePending's invitation to seed.organizations.qualified is the one an
//   administrator accepts on the invited person's behalf.

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

async function expectStillPendingForInvitedPerson(surface: Surface): Promise<void> {
  await surface.signIn(persona.invitedVendor);
  await surface.organizationUserMembershipsSelf.open();
  await expect
    .poll(() => surface.organizationUserMembershipsSelf.affiliatedOrganizationsTable())
    .toContain(invitedTo.legal_name);
  await expect.poll(orAbsent(() => surface.organizationUserMembershipsSelf.pendingBadge())).toBeTruthy();
}

test("nobody else can accept a pending invitation: the organization's owner's attempt to accept it on the invited person's behalf is refused", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await acceptByRequest(surface);

  expect(await orAbsent(() => surface.affiliationApprovalRequest.refusalMessages())()).toBeTruthy();
  expect(await orAbsent(() => surface.affiliationApprovalRequest.requestAccepted())()).toBeFalsy();

  // Nothing was accepted: the invited person still sees the invitation as pending.
  await expectStillPendingForInvitedPerson(surface);
});

test("a pending invitation becomes an active membership when the invited person accepts it", async ({ surface }) => {
  await surface.signIn(persona.invitedVendor);
  await surface.organizationUserMembershipsSelf.open();
  await surface.organizationUserMembershipsSelf.approveInvitation({ organization: invitedTo.legal_name });

  await surface.organizationUserMembershipsSelf.open();
  await expect
    .poll(() => surface.organizationUserMembershipsSelf.affiliatedOrganizationsTable())
    .toContain(invitedTo.legal_name);
  await expect.poll(orAbsent(() => surface.organizationUserMembershipsSelf.pendingBadge())).toBeFalsy();
});

test("a pending invitation becomes an active membership when an administrator accepts it on the invited person's behalf", async ({
  surface,
}) => {
  const organization = seed.organizations.qualified;
  const invited = seed.users.teamCandidatePending;

  await surface.signIn(persona.administrator);
  await surface.organizationUserMemberships.open({ userId: invited.id });
  await surface.organizationUserMemberships.approveInvitation({ organization: organization.legal_name });

  await surface.organizationUserMemberships.open({ userId: invited.id });
  await expect
    .poll(() => surface.organizationUserMemberships.affiliatedOrganizationsTable())
    .toContain(organization.legal_name);
  await expect.poll(orAbsent(() => surface.organizationUserMemberships.pendingBadge())).toBeFalsy();
});

test("an invitation that is not pending cannot be accepted: a further attempt to accept the now-active membership is refused as not pending", async ({
  surface,
}) => {
  // The invited person, who is permitted to accept, accepts; the membership becomes active.
  await surface.signIn(persona.invitedVendor);
  await acceptByRequest(surface);
  expect(await surface.affiliationApprovalRequest.requestAccepted()).toBeTruthy();
  expect(await surface.affiliationApprovalRequest.membershipStatus()).toBe("ACTIVE");

  // The same person tries again: refused, and the reason is that it is not pending.
  await acceptByRequest(surface);
  expect(await orAbsent(() => surface.affiliationApprovalRequest.requestAccepted())()).toBeFalsy();
  expect(await surface.affiliationApprovalRequest.refusalMessages()).toMatch(/not pending/i);

  // The membership is unchanged: still the invited person's, still active.
  await surface.organizationUserMembershipsSelf.open();
  await expect
    .poll(() => surface.organizationUserMembershipsSelf.affiliatedOrganizationsTable())
    .toContain(invitedTo.legal_name);
  await expect.poll(orAbsent(() => surface.organizationUserMembershipsSelf.pendingBadge())).toBeFalsy();
});
