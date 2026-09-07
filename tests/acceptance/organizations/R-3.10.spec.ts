// criterion: @R-3.10 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// The organization is built through the surface so that ending a membership does not
// take a member out of a seeded organization other criteria read.
const details = {
  legalName: "Cormorant Bay Membership Ends Ltd.",
  streetAddress: "3 Marine Way",
  addressLineTwo: "",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8V1V1",
  country: "Canada",
  contactName: "Leaving Test Contact",
  contactTitle: "",
  contactEmail: "cormorant.bay@example.test",
  contactPhone: "",
  website: "",
};

test("when an active member chooses to leave, the membership becomes inactive and the person stops counting towards the organization's team", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(details);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: details.legalName });
  await surface.organizationEdit.addTeamMembers({ emails: [seed.users.organizationMember.email] });

  await surface.signIn(persona.organizationMember);
  await surface.organizationUserMemberships.open({ userId: seed.users.organizationMember.id });
  await surface.organizationUserMemberships.approveInvitation({ organization: details.legalName });

  await surface.signIn(persona.organizationOwner);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: details.legalName });
  expect(await surface.organizationEdit.teamMemberRow()).toContain(seed.users.organizationMember.email);

  await surface.signIn(persona.organizationMember);
  await surface.organizationUserMemberships.open({ userId: seed.users.organizationMember.id });
  await surface.organizationUserMemberships.leaveOrganization({ organization: details.legalName });

  expect(await surface.organizationUserMemberships.affiliatedOrganizationsTable()).not.toContain(details.legalName);

  await surface.signIn(persona.organizationOwner);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: details.legalName });
  expect(await surface.organizationEdit.teamMemberRow()).not.toContain(seed.users.organizationMember.email);
});
