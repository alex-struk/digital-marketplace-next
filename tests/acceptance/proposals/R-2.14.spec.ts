// criterion: @R-2.14 v2
// provenance: blind, spec@c1e09955fdff55e84870c25dfcb8e0fd9981c437, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Every proposal here is put to the service through proposal-cwu-request, which carries the
// proponent exactly as given: a blank or malformed individual field, or an organization the
// screen would never offer. Each test makes one attempt against the seeded Code With Us
// opportunity that is open until 2030, so an accepted request never meets an earlier one.
//
// The organization proponent is tried three ways: an active organization the signed-in
// vendor has no membership of (accepted, since membership is not checked), an organization
// that has been archived (refused, since it is not active), and an identifier that names no
// organization at all (refused, since it does not exist). Where the service reports the
// refusal for a missing organization is its own choice, so only the refusal is asserted.

const statement =
  "A Code With Us proponent is either a named individual carrying a legal name, an email address and a full postal address, each field validated in turn, or an organization identified by id and checked only for existence and active status, since the service does not verify that the vendor belongs to the organization they name.";

const opportunityId = seed.opportunities.publishedCodeWithUs.id;
const settle = { timeout: 20000 };

const proposalFields = {
  opportunityId,
  proposalText: "A proposal offered through a direct request.",
  additionalComments: "None.",
};

const completeIndividual = {
  legalName: "Robin Vendor",
  email: "robin.vendor@example.test",
  phone: "250-555-0199",
  street1: "1200 Government Street",
  street2: "",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8W1V1",
  country: "Canada",
};

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function submitIndividual(surface: Surface, individual: Record<string, string>): Promise<void> {
  await surface.proposalCwuRequest.open();
  await surface.proposalCwuRequest.submitWithIndividualProponent({ ...proposalFields, ...individual });
}

async function submitOrganization(surface: Surface, organizationId: string): Promise<void> {
  await surface.proposalCwuRequest.open();
  await surface.proposalCwuRequest.submitWithOrganizationProponent({ ...proposalFields, organizationId });
}

async function expectAccepted(surface: Surface, what: string): Promise<void> {
  await expect
    .poll(() => readOrEmpty(() => surface.proposalCwuRequest.requestAccepted()), { ...settle, message: what })
    .toBeTruthy();
  expect(await readOrEmpty(() => surface.proposalCwuRequest.proposalIdentifier()), what).toBeTruthy();
  expect(await readOrEmpty(() => surface.proposalCwuRequest.refusalByField()), what).toBeFalsy();
}

async function expectRefused(surface: Surface, what: string): Promise<string> {
  await expect
    .poll(() => readOrEmpty(() => surface.proposalCwuRequest.refusalStatus()), { ...settle, message: what })
    .toBeTruthy();
  expect(await readOrEmpty(() => surface.proposalCwuRequest.requestAccepted()), what).toBeFalsy();
  expect(await readOrEmpty(() => surface.proposalCwuRequest.refusalMessages()), what).toBeTruthy();
  return readOrEmpty(() => surface.proposalCwuRequest.refusalByField());
}

// Each field, left blank, is refused against that field by name.
const blank: Array<[string, string, RegExp]> = [
  ["legalName", "the legal name", /legal\s*name/i],
  ["email", "the email address", /e-?mail/i],
  ["street1", "the street address", /street|address/i],
  ["city", "the city", /city/i],
  ["region", "the province", /province|region/i],
  ["mailCode", "the postal code", /postal|mail\s*code/i],
  ["country", "the country", /country/i],
];

for (const [field, named, reportedAs] of blank) {
  test(`${statement} (an individual with ${named} missing is refused against that field)`, async ({ surface }) => {
    await surface.signIn(persona.vendor);
    await submitIndividual(surface, { ...completeIndividual, [field]: "" });
    const byField = await expectRefused(surface, `${named} is missing`);
    expect(byField, `the refusal names ${named}`).toMatch(reportedAs);
  });
}

// Each field whose form the service checks, malformed, is refused against that field by name.
const malformed: Array<[string, string, string, RegExp]> = [
  ["email", "the email address", "not-an-email-address", /e-?mail/i],
  ["phone", "the phone number", "not a phone number", /phone/i],
];

for (const [field, named, value, reportedAs] of malformed) {
  test(`${statement} (an individual with ${named} malformed is refused against that field)`, async ({ surface }) => {
    await surface.signIn(persona.vendor);
    await submitIndividual(surface, { ...completeIndividual, [field]: value });
    const byField = await expectRefused(surface, `${named} is malformed`);
    expect(byField, `the refusal names ${named}`).toMatch(reportedAs);
  });
}

test(`${statement} (an individual carrying every field is accepted)`, async ({ surface }) => {
  await surface.signIn(persona.vendor);
  await submitIndividual(surface, completeIndividual);
  await expectAccepted(surface, "a complete individual proponent is accepted");
});

test(`${statement} (an organization that does not exist is refused)`, async ({ surface }) => {
  await surface.signIn(persona.vendor);
  await submitOrganization(surface, seed.unassigned_identifiers.organizationNeverCreated.id);
  await expectRefused(surface, "an identifier naming no organization");
});

test(`${statement} (an organization that is not active is refused)`, async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await submitOrganization(surface, seed.organizations.archived.id);
  await expectRefused(surface, "an archived organization, owned by the signed-in vendor");
});

test(`${statement} (an active organization the vendor does not belong to is accepted)`, async ({ surface }) => {
  await surface.signIn(persona.vendor);
  await submitOrganization(surface, seed.organizations.qualified.id);
  await expectAccepted(surface, "an active organization the vendor has no membership of is accepted");
});
