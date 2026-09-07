// criterion: @R-3.23 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

const details = {
  legalName: "Foxglove Owned From Registration Ltd.",
  streetAddress: "6 Marine Way",
  addressLineTwo: "",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8V1V1",
  country: "Canada",
  contactName: "Registration Owner Contact",
  contactTitle: "",
  contactEmail: "foxglove@example.test",
  contactPhone: "",
  website: "",
};

test("the organization appears under the registering vendor's owned organizations with them recorded as its owner, and it is active from the moment it is registered", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(details);

  await surface.organizationUserMemberships.open({ userId: seed.users.organizationOwner.id });
  expect(await surface.organizationUserMemberships.ownedOrganizationsTable()).toContain(details.legalName);

  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: details.legalName });
  expect(await surface.organizationEdit.ownerBadge()).toBeTruthy();

  // The organization list carries only organizations that have not been archived, so an
  // organization appearing there is one that is active.
  await surface.organizationList.open();
  expect(await surface.organizationList.organizationName()).toContain(details.legalName);
});
