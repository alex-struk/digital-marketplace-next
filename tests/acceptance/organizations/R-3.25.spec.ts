// criterion: @R-3.25 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

const oneMemberOnly = {
  legalName: "Hazel Bank Not Sprint Qualified Ltd.",
  streetAddress: "8 Marine Way",
  addressLineTwo: "",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8V1V1",
  country: "Canada",
  contactName: "Qualification Test Contact",
  contactTitle: "",
  contactEmail: "hazel.bank@example.test",
  contactPhone: "",
  website: "",
};

test("an organization with more than two active members holding every capability and accepted Sprint With Us terms is qualified", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });

  expect(await surface.organizationEdit.swuQualifiedBadge()).toBeTruthy();
  expect(await surface.organizationEdit.swuRequirementTwoMembers()).toBeTruthy();
  expect(await surface.organizationEdit.swuRequirementAllCapabilities()).toBeTruthy();
  expect(await surface.organizationEdit.swuRequirementTermsAccepted()).toBeTruthy();
});

test("an organization that has neither two active members, nor every capability, nor accepted terms is marked as not qualified", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(oneMemberOnly);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: oneMemberOnly.legalName });

  expect(await surface.organizationEdit.notQualifiedNotice()).toBeTruthy();
  expect(await surface.organizationEdit.swuQualifiedBadge()).toBeFalsy();
});
