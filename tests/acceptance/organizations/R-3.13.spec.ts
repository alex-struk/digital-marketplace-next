// criterion: @R-3.13 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// Ownership is transferred in organizations the tests build themselves, so that the
// owner recorded on a seeded organization stays as the seed describes it.
const base = {
  streetAddress: "4 Marine Way",
  addressLineTwo: "",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8V1V1",
  country: "Canada",
  contactName: "Ownership Test Contact",
  contactTitle: "",
  contactEmail: "ownership.contact@example.test",
  contactPhone: "",
  website: "",
};

const forTransfer = { ...base, legalName: "Dogwood Transfer Of Ownership Ltd." };
const forPendingMember = { ...base, legalName: "Dogwood Pending Member Ownership Ltd." };

test("an administrator transfers ownership to the active member, who becomes the owner while the previous owner becomes an ordinary member", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(forTransfer);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: forTransfer.legalName });
  await surface.organizationEdit.addTeamMembers({ emails: [seed.users.organizationMember.email] });

  await surface.signIn(persona.organizationMember);
  await surface.organizationUserMemberships.open({ userId: seed.users.organizationMember.id });
  await surface.organizationUserMemberships.approveInvitation({ organization: forTransfer.legalName });

  await surface.signIn(persona.administrator);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: forTransfer.legalName });
  await surface.organizationEdit.changeOwner({ newOwner: seed.users.organizationMember });

  await surface.signIn(persona.organizationMember);
  await surface.organizationUserMemberships.open({ userId: seed.users.organizationMember.id });
  expect(await surface.organizationUserMemberships.ownedOrganizationsTable()).toContain(forTransfer.legalName);

  await surface.signIn(persona.organizationOwner);
  await surface.organizationUserMemberships.open({ userId: seed.users.organizationOwner.id });
  expect(await surface.organizationUserMemberships.ownedOrganizationsTable()).not.toContain(forTransfer.legalName);
  expect(await surface.organizationUserMemberships.affiliatedOrganizationsTable()).toContain(forTransfer.legalName);
});

test("the pending member cannot be chosen as the new owner", async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(forPendingMember);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: forPendingMember.legalName });
  await surface.organizationEdit.addTeamMembers({ emails: [seed.users.fileUploader.email] });

  await surface.signIn(persona.administrator);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: forPendingMember.legalName });
  await surface.organizationEdit.changeOwner({ newOwner: seed.users.fileUploader });

  expect(await surface.organizationEdit.fieldError()).toBeTruthy();

  await surface.signIn(persona.organizationOwner);
  await surface.organizationUserMemberships.open({ userId: seed.users.organizationOwner.id });
  expect(await surface.organizationUserMemberships.ownedOrganizationsTable()).toContain(forPendingMember.legalName);
});
