// criterion: @R-3.6 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// Both tests build their own organization through the surface rather than archiving a
// seeded one, because archiving is irreversible and the seeded organizations are what
// every other criterion in this domain reads.
const base = {
  streetAddress: "2 Marine Way",
  addressLineTwo: "",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8V1V1",
  country: "Canada",
  contactName: "Archive Test Contact",
  contactTitle: "",
  contactEmail: "archive.contact@example.test",
  contactPhone: "",
  website: "",
};

const forListCheck = { ...base, legalName: "Birchwood Archive Off The List Ltd." };
const forMemberCheck = { ...base, legalName: "Birchwood Archive Off A Member List Ltd." };

test("when the owner archives an active organization it is gone from the public organization list", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(forListCheck);

  await surface.organizationList.open();
  expect(await surface.organizationList.organizationName()).toContain(forListCheck.legalName);

  await surface.organizationList.openOrganization({ legalName: forListCheck.legalName });
  await surface.organizationEdit.archiveOrganization();

  await surface.organizationList.open();
  expect(await surface.organizationList.organizationName()).not.toContain(forListCheck.legalName);
});

test("when the owner archives an active organization it is gone from the other member's affiliated organizations", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(forMemberCheck);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: forMemberCheck.legalName });
  await surface.organizationEdit.addTeamMembers({ emails: [seed.users.organizationMember.email] });

  await surface.signIn(persona.organizationMember);
  await surface.organizationUserMemberships.open({ userId: seed.users.organizationMember.id });
  await surface.organizationUserMemberships.approveInvitation({ organization: forMemberCheck.legalName });
  expect(await surface.organizationUserMemberships.affiliatedOrganizationsTable()).toContain(
    forMemberCheck.legalName,
  );

  await surface.signIn(persona.organizationOwner);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: forMemberCheck.legalName });
  await surface.organizationEdit.archiveOrganization();

  await surface.signIn(persona.organizationMember);
  await surface.organizationUserMemberships.open({ userId: seed.users.organizationMember.id });
  expect(await surface.organizationUserMemberships.affiliatedOrganizationsTable()).not.toContain(
    forMemberCheck.legalName,
  );
});
