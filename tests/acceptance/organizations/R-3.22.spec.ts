// criterion: @R-3.22 v2
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

const complete = {
  legalName: "Elderberry Registration Fields Ltd.",
  streetAddress: "5 Marine Way",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8V1V1",
  country: "Canada",
  contactName: "Registration Test Contact",
  contactEmail: "elderberry@example.test",
  addressLineTwo: "",
  contactTitle: "",
  contactPhone: "",
  website: "",
};

test("a submission with the legal name left blank does not create the organization and reports the field as invalid", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);

  // A submission with no legal name leaves nothing to look the organization up by, so
  // what stands for "not created" is that the vendor owns exactly what they owned before.
  await surface.organizationUserMemberships.open({ userId: seed.users.organizationOwner.id });
  const ownedBefore = await surface.organizationUserMemberships.ownedOrganizationsTable();

  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization({ ...complete, legalName: "" });

  expect(await surface.organizationCreate.fieldError()).toBeTruthy();

  await surface.organizationUserMemberships.open({ userId: seed.users.organizationOwner.id });
  expect(await surface.organizationUserMemberships.ownedOrganizationsTable()).toBe(ownedBefore);
});

test("a submission with a contact email of \"not-an-email\" does not create the organization and reports the field as invalid", async ({
  surface,
}) => {
  const withBadEmail = {
    ...complete,
    legalName: "Elderberry Invalid Contact Email Ltd.",
    contactEmail: "not-an-email",
  };

  await surface.signIn(persona.organizationOwner);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(withBadEmail);

  expect(await surface.organizationCreate.fieldError()).toBeTruthy();

  await surface.organizationList.open();
  expect(await surface.organizationList.organizationName()).not.toContain(withBadEmail.legalName);
});

test("the same submission with the optional website, second address line, contact title and phone left empty succeeds", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(complete);

  await surface.organizationUserMemberships.open({ userId: seed.users.organizationOwner.id });
  expect(await surface.organizationUserMemberships.ownedOrganizationsTable()).toContain(complete.legalName);
});
