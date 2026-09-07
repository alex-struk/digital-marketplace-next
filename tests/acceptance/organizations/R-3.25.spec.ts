// criterion: @R-3.25 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// The state the criterion describes — the team requirements met while the terms are still
// outstanding — cannot be reached in a seeded organization: the qualified one has already
// accepted its Sprint With Us terms and the surface offers no way to un-accept them. So
// the organization is built here and its members invited, leaving the terms alone. It
// takes the owner and two others rather than the criterion's single further member
// because the nine capabilities the service recognises are split three ways across the
// seeded people.
const termsOutstanding = {
  legalName: "Hazel Bank Terms Outstanding Ltd.",
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
});

test("with the team-size and capability requirements met and the terms requirement unmet, the organization is marked as not qualified", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(termsOutstanding);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: termsOutstanding.legalName });

  // Read while the organization is its owner alone and no terms have been accepted, so
  // that all three requirements stand unmet. These are the readings a requirement shown
  // as met is afterwards told apart from; what the page calls either state is its own
  // business.
  const twoMembersUnmet = await surface.organizationEdit.swuRequirementTwoMembers();
  const capabilitiesUnmet = await surface.organizationEdit.swuRequirementAllCapabilities();
  const termsUnmet = await surface.organizationEdit.swuRequirementTermsAccepted();

  await surface.organizationEdit.addTeamMembers({
    emails: [seed.users.organizationAdmin.email, seed.users.organizationMember.email],
  });

  await surface.signIn(persona.organizationAdmin);
  await surface.organizationUserMemberships.open({ userId: seed.users.organizationAdmin.id });
  await surface.organizationUserMemberships.approveInvitation({ organization: termsOutstanding.legalName });

  await surface.signIn(persona.organizationMember);
  await surface.organizationUserMemberships.open({ userId: seed.users.organizationMember.id });
  await surface.organizationUserMemberships.approveInvitation({ organization: termsOutstanding.legalName });

  await surface.signIn(persona.organizationOwner);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: termsOutstanding.legalName });

  // The two requirements the three active members satisfy now read differently than they
  // did while unmet; the terms requirement, which nothing has touched, reads as it did.
  expect(await surface.organizationEdit.swuRequirementTwoMembers()).not.toBe(twoMembersUnmet);
  expect(await surface.organizationEdit.swuRequirementAllCapabilities()).not.toBe(capabilitiesUnmet);
  expect(await surface.organizationEdit.swuRequirementTermsAccepted()).toBe(termsUnmet);

  expect(await surface.organizationEdit.swuQualifiedBadge()).toBeFalsy();
  expect(await surface.organizationEdit.notQualifiedNotice()).toBeTruthy();
});
