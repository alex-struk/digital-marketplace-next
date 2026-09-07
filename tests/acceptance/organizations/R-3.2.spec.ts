// criterion: @R-3.2 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

const byVendor = {
  legalName: "Aspen Ridge Registered By Vendor Ltd.",
  streetAddress: "1 Marine Way",
  addressLineTwo: "",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8V1V1",
  country: "Canada",
  contactName: "Vendor Contact",
  contactTitle: "",
  contactEmail: "aspen.ridge@example.test",
  contactPhone: "",
  website: "",
};

const byPublicSectorStaff = { ...byVendor, legalName: "Aspen Ridge Registered By Staff Ltd." };

test("the vendor's organization is created", async ({ surface }) => {
  await surface.signIn(persona.vendor);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(byVendor);

  await surface.organizationUserMemberships.open({ userId: seed.users.vendorOne.id });
  expect(await surface.organizationUserMemberships.ownedOrganizationsTable()).toContain(byVendor.legalName);
});

test("the public sector staff member's request to register an organization is refused as not permitted", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(byPublicSectorStaff);

  await surface.organizationList.open();
  expect(await surface.organizationList.organizationName()).not.toContain(byPublicSectorStaff.legalName);
});
