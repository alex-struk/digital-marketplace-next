// criterion: @R-3.7 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

const invitees = [seed.users.fileUploader.email, seed.users.vendorWithNoticesOff.email];

test("when the owner invites two email addresses at once both people appear on the team list marked as pending, and neither counts towards the organization's team size", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.organizationEdit.open({ orgId: seed.organizations.unqualified.id });

  // How the Sprint With Us page shows the two-active-members requirement is read before
  // and after: it is a requirement's state, not a count, so the only thing it can be held
  // against is its own earlier reading. An invitation that counted towards the team would
  // move the requirement, and it must not.
  const twoMemberRequirementBefore = await surface.organizationEdit.swuRequirementTwoMembers();

  await surface.organizationEdit.addTeamMembers({ emails: invitees });

  const rows = await surface.organizationEdit.teamMemberRow();
  expect(rows).toContain(invitees[0]);
  expect(rows).toContain(invitees[1]);
  expect(await surface.organizationEdit.pendingBadge()).toBeTruthy();

  expect(await surface.organizationEdit.swuRequirementTwoMembers()).toBe(twoMemberRequirementBefore);
});
