// criterion: @R-3.34 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

const details = {
  legalName: "Ironwood Capabilities Of Accepted Members Ltd.",
  streetAddress: "9 Marine Way",
  addressLineTwo: "",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8V1V1",
  country: "Canada",
  contactName: "Capability Test Contact",
  contactTitle: "",
  contactEmail: "ironwood@example.test",
  contactPhone: "",
  website: "",
};

// A capability the invited person holds and the owner of the new organization does not.
const invitedPersonsCapability = seed.users.organizationMember.capabilities[0];

test("a capability held only by an invited person who has not yet accepted is shown as one the team does not have, and becomes shown as held once the invitation is accepted", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(details);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: details.legalName });
  await surface.organizationEdit.addTeamMembers({ emails: [seed.users.organizationMember.email] });

  const capabilitiesWhilePending = await surface.organizationEdit.teamCapabilities();
  expect(capabilitiesWhilePending).not.toContain(invitedPersonsCapability);

  await surface.signIn(persona.organizationMember);
  await surface.organizationUserMemberships.open({ userId: seed.users.organizationMember.id });
  await surface.organizationUserMemberships.approveInvitation({ organization: details.legalName });

  await surface.signIn(persona.organizationOwner);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: details.legalName });
  expect(await surface.organizationEdit.teamCapabilities()).toContain(invitedPersonsCapability);
});
