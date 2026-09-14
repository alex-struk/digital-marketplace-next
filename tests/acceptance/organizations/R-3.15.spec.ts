// criterion: @R-3.15 v1
// provenance: blind, spec@1c3743e9fb53c29de89a28045222abab29c5e27e, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// The criterion's given is one vendor standing in four relations at once, which no seeded
// person does. The organization administrator already administers the qualified
// organization; the rest is built here: an organization they register and keep, one they
// register and archive, and an ordinary membership of the unqualified organization, which
// its owner invites them to and they accept.
const base = {
  streetAddress: "11 Marine Way",
  addressLineTwo: "",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8V1V1",
  country: "Canada",
  contactName: "Act On Behalf Contact",
  contactTitle: "",
  contactPhone: "",
  website: "",
};
const owned = { ...base, legalName: "Kestrel Point Owned Ltd.", contactEmail: "kestrel.point@example.test" };
const ownedThenArchived = {
  ...base,
  legalName: "Kestrel Point Archived Ltd.",
  contactEmail: "kestrel.point.archived@example.test",
};
const administered = seed.organizations.qualified;
const memberOnly = seed.organizations.unqualified;

test("for a vendor who owns one organization, administers a second, is an ordinary member of a third, and owns a fourth that has been archived, the first two are returned as the organizations they can act for and the third and fourth are not", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.organizationEdit.open({ orgId: memberOnly.id });
  await surface.organizationEdit.addTeamMembers({ emails: [seed.users.organizationAdmin.email] });

  await surface.signIn(persona.organizationAdmin);
  await surface.organizationUserMembershipsSelf.open();
  await surface.organizationUserMembershipsSelf.approveInvitation({ organization: memberOnly.legal_name });
  expect(await surface.organizationUserMembershipsSelf.affiliatedOrganizationsTable()).toContain(
    memberOnly.legal_name,
  );

  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(owned);

  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(ownedThenArchived);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: ownedThenArchived.legalName });
  await surface.organizationEdit.archiveOrganization();

  await surface.organizationList.open();
  await surface.organizationList.myOrganizations();

  // The unqualified organization is on the unfiltered list of organizations, so its absence
  // here, beside the two that are present, is the narrowing the criterion describes.
  const actFor = await surface.organizationList.organizationName();
  expect(actFor).toContain(owned.legalName);
  expect(actFor).toContain(administered.legal_name);
  expect(actFor).not.toContain(memberOnly.legal_name);
  expect(actFor).not.toContain(ownedThenArchived.legalName);
});
