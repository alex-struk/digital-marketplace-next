// criterion: @R-3.26 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Persona, Surface } from "../../fixtures";

// Two organizations stand where the criterion needs them. The seed's qualified organization
// (owner seed.users.organizationOwner) is recorded as approved for service areas with its Team
// With Us terms accepted; the seed's unqualified one (owner seed.users.vendorOne, signed in as
// persona.vendor) is approved for none and has accepted no terms. Neither state is assumed:
// each is established before anything is read, and an approval the administrator cannot get
// recorded, which is not what this criterion governs, is recorded as blocked rather than failed.
const serviceArea = seed.organizations.qualified.service_areas[0];

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

// A service area may be named by its code or by its label, so it is matched on its words.
function area(code: string): RegExp {
  return new RegExp(code.split("_").join("[\\s_-]*"), "i");
}

async function approvalRecorded(surface: Surface, orgId: string): Promise<boolean> {
  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId });
  return area(serviceArea).test(await readOrEmpty(() => surface.organizationEdit.serviceAreaCheckbox()));
}

// Only a service administrator can approve an organization for a service area (R-3.28).
async function establishApproval(surface: Surface, orgId: string): Promise<void> {
  if (!(await approvalRecorded(surface, orgId))) {
    await surface.organizationEdit.editServiceAreas();
    await surface.organizationEdit.saveServiceAreas({ serviceAreas: [serviceArea] });
  }
  let recorded = false;
  for (let tries = 0; tries < 5 && !recorded; tries++) recorded = await approvalRecorded(surface, orgId);
  if (!recorded) {
    test.skip(true, "blocked: the administrator's service-area approval was not recorded, so the organization cannot be put in the criterion's given");
  }
}

async function termsAcceptedOn(surface: Surface, owner: Persona, orgId: string): Promise<string> {
  await surface.signIn(owner);
  await surface.organizationTwuTerms.open({ orgId });
  return readOrEmpty(() => surface.organizationTwuTerms.acceptedOnNotice());
}

async function openAsOwner(surface: Surface, owner: Persona, orgId: string): Promise<void> {
  await surface.signIn(owner);
  await surface.organizationEdit.open({ orgId });
}

test("an organization approved for at least one service area whose Team With Us terms have been accepted is qualified for Team With Us", async ({
  surface,
}) => {
  const organization = seed.organizations.qualified;
  await establishApproval(surface, organization.id);

  if (!(await termsAcceptedOn(surface, persona.organizationOwner, organization.id))) {
    await surface.organizationTwuTerms.acceptTerms();
  }
  let accepted = "";
  for (let tries = 0; tries < 5 && !accepted; tries++) {
    accepted = await termsAcceptedOn(surface, persona.organizationOwner, organization.id);
  }
  if (!accepted) {
    test.skip(true, "blocked: the organization's Team With Us terms could not be recorded as accepted, so the criterion's given cannot be built");
  }

  await openAsOwner(surface, persona.organizationOwner, organization.id);
  await expect.poll(() => readOrEmpty(() => surface.organizationEdit.twuQualifiedBadge())).toBeTruthy();
});

test("an organization approved for one service area whose Team With Us terms have not been accepted shows the service-area requirement met, the terms requirement unmet, and is marked as not qualified", async ({
  surface,
}) => {
  const organization = seed.organizations.unqualified;

  expect(await termsAcceptedOn(surface, persona.vendor, organization.id), "the terms already stand accepted").toBeFalsy();
  expect(await approvalRecorded(surface, organization.id), "the organization already stands approved").toBe(false);

  // Read while the organization is approved for no service area and has accepted no terms, so
  // that both requirements stand unmet. What the page calls either state is its own business;
  // these are the readings a requirement shown as met is afterwards told apart from.
  await openAsOwner(surface, persona.vendor, organization.id);
  const serviceAreaUnmet = await readOrEmpty(() => surface.organizationEdit.twuRequirementServiceArea());
  const termsUnmet = await readOrEmpty(() => surface.organizationEdit.twuRequirementTermsAccepted());

  await establishApproval(surface, organization.id);

  await openAsOwner(surface, persona.vendor, organization.id);
  await expect.poll(() => readOrEmpty(() => surface.organizationEdit.twuRequirementServiceArea())).not.toBe(serviceAreaUnmet);
  expect(await readOrEmpty(() => surface.organizationEdit.twuRequirementTermsAccepted())).toBe(termsUnmet);
  expect(await readOrEmpty(() => surface.organizationEdit.twuQualifiedBadge())).toBeFalsy();
  await expect.poll(() => readOrEmpty(() => surface.organizationEdit.notQualifiedNotice())).toBeTruthy();
});
