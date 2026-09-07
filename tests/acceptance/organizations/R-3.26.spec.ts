// criterion: @R-3.26 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// No seeded organization stands where the criterion needs one: the qualified organization
// has accepted its Team With Us terms and the surface offers no way to un-accept them,
// and the unqualified one is approved for no service area. So the organization is built
// here and an administrator approves it for a service area, leaving the terms alone.
const termsOutstanding = {
  legalName: "Juniper Reach Service Area Only Ltd.",
  streetAddress: "10 Marine Way",
  addressLineTwo: "",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8V1V1",
  country: "Canada",
  contactName: "Qualification Test Contact",
  contactTitle: "",
  contactEmail: "juniper.reach@example.test",
  contactPhone: "",
  website: "",
};

const serviceArea = seed.organizations.qualified.service_areas[0];

test("an organization approved for service areas whose Team With Us terms have been accepted is qualified", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });

  expect(await surface.organizationEdit.twuQualifiedBadge()).toBeTruthy();
});

test("with the service-area requirement met and the terms requirement unmet, the organization is marked as not qualified", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(termsOutstanding);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: termsOutstanding.legalName });

  // Read while the organization is approved for no service area and has accepted no
  // terms, so that both requirements stand unmet. These are the readings a requirement
  // shown as met is afterwards told apart from.
  const serviceAreaUnmet = await surface.organizationEdit.twuRequirementServiceArea();
  const termsUnmet = await surface.organizationEdit.twuRequirementTermsAccepted();

  // Only a service administrator can approve an organization for a service area, so the
  // organization's own owner cannot bring this requirement about.
  await surface.signIn(persona.administrator);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: termsOutstanding.legalName });
  await surface.organizationEdit.editServiceAreas();
  await surface.organizationEdit.saveServiceAreas({ serviceAreas: [serviceArea] });

  await surface.signIn(persona.organizationOwner);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: termsOutstanding.legalName });

  // The approved service area moves its requirement; the terms requirement, which nothing
  // has touched, reads as it did.
  expect(await surface.organizationEdit.twuRequirementServiceArea()).not.toBe(serviceAreaUnmet);
  expect(await surface.organizationEdit.twuRequirementTermsAccepted()).toBe(termsUnmet);

  expect(await surface.organizationEdit.twuQualifiedBadge()).toBeFalsy();
  expect(await surface.organizationEdit.notQualifiedNotice()).toBeTruthy();
});
