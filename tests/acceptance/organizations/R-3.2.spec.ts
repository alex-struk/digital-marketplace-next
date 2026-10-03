// criterion: @R-3.2 v1
// provenance: blind, spec@658792c3c7c79540af12cf18a97a260fc2484f16, derived 2026-10-03
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

// The other half of the criterion — a request from anyone else refused — has no observation
// the surface offers to read the refusal from; it is recorded against this criterion in
// not-testable.yaml.
test("only a signed-in vendor who has already accepted the service's terms and conditions may register a new organization: the vendor's organization is created", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(byVendor);

  await surface.organizationUserMemberships.open({ userId: seed.users.vendorOne.id });
  expect(await surface.organizationUserMemberships.ownedOrganizationsTable()).toContain(byVendor.legalName);
});
