// criterion: @R-2.14 v2
// provenance: blind, spec@c1e09955fdff55e84870c25dfcb8e0fd9981c437, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Every test makes exactly one proposal attempt, against the seeded Code With Us opportunity
// that is open until 2030 and carries no proposal, so no test waits on building an
// opportunity and none makes more than one attempt within its time. Whether a proposal was
// submitted is read off the proponent's own list of proposals, where the opportunity's title
// appears only once a proposal against it has been accepted.
//
// What counts as refused. A form that withholds the submission — the submit control stays
// unavailable, or the step cannot be completed — has rejected it just as surely as a reply
// from the service would, so a step that cannot be carried out is read as the refusal and the
// test goes on to confirm nothing was submitted. Where every step was carried out, the service
// has answered, so the test also waits for the offending field to be reported. An archived
// organization that the form does not offer as a choice has been refused in the same way.
//
// The clauses no test here reaches — which field a reported error belongs to, an organization
// that does not exist, and an organization the vendor does not belong to — are recorded in
// not-testable.yaml.

const statement =
  "A Code With Us proponent is either a named individual carrying a legal name, an email address and a full postal address, each field validated in turn, or an organization identified by id and checked only for existence and active status, since the service does not verify that the vendor belongs to the organization they name.";

const opportunity = seed.opportunities.publishedCodeWithUs;
const settle = { timeout: 20000 };

const completeIndividual = {
  legalName: "Robin Vendor",
  email: "robin.vendor@example.test",
  phone: "250-555-0199",
  streetAddress: "1200 Government Street",
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

// Carries out one attempt, returning whether every step could be taken. A step the form will
// not let the proponent take is the form refusing the submission.
async function attempt(steps: Array<() => Promise<void>>): Promise<boolean> {
  try {
    for (const step of steps) await step();
    return true;
  } catch {
    return false;
  }
}

async function myProposals(surface: Surface): Promise<string> {
  await surface.proposalVendorDashboard.open();
  await attempt([() => surface.proposalVendorDashboard.showMyProposals()]);
  return readOrEmpty(() => surface.proposalVendorDashboard.myProposalsTable());
}

function proposeAsIndividual(surface: Surface, individual: Record<string, string>): Promise<boolean> {
  return attempt([
    () => surface.proposalCwuCreate.open({ opportunityId: opportunity.id }),
    () => surface.proposalCwuCreate.chooseProponentIndividual(individual),
    () => surface.proposalCwuCreate.acceptProgramTerms(),
    () => surface.proposalCwuCreate.acceptAppTerms(),
    () =>
      surface.proposalCwuCreate.submitProposal({
        proposalText: "A proposal offered by a named individual.",
      }),
  ]);
}

function proposeForOrganization(surface: Surface, organization: unknown): Promise<boolean> {
  return attempt([
    () => surface.proposalCwuCreate.open({ opportunityId: opportunity.id }),
    () => surface.proposalCwuCreate.chooseProponentOrganization({ organization }),
    () => surface.proposalCwuCreate.acceptProgramTerms(),
    () => surface.proposalCwuCreate.acceptAppTerms(),
    () =>
      surface.proposalCwuCreate.submitProposal({
        proposalText: "A proposal offered on behalf of an organization.",
      }),
  ]);
}

async function expectRefused(surface: Surface, completed: boolean, what: string): Promise<void> {
  if (completed) {
    await expect
      .poll(() => readOrEmpty(() => surface.proposalCwuCreate.fieldError()), {
        ...settle,
        message: `the offending field is reported when ${what}`,
      })
      .toBeTruthy();
  }
  expect(await myProposals(surface), `a proposal was submitted when ${what}`).not.toContain(
    opportunity.title,
  );
}

const missing: Array<[string, string]> = [
  ["legalName", "the legal name"],
  ["email", "the email address"],
  ["streetAddress", "the street address"],
  ["city", "the city"],
  ["region", "the province"],
  ["mailCode", "the postal code"],
  ["country", "the country"],
];

for (const [field, named] of missing) {
  test(`${statement} (an individual with ${named} missing is refused)`, async ({ surface }) => {
    await surface.signIn(persona.vendor);
    const completed = await proposeAsIndividual(surface, { ...completeIndividual, [field]: "" });
    await expectRefused(surface, completed, `${named} is missing`);
  });
}

const malformed: Array<[string, string, string]> = [
  ["email", "the email address", "not-an-email-address"],
  ["phone", "the phone number", "not a phone number"],
];

for (const [field, named, value] of malformed) {
  test(`${statement} (an individual with ${named} malformed is refused)`, async ({ surface }) => {
    await surface.signIn(persona.vendor);
    const completed = await proposeAsIndividual(surface, { ...completeIndividual, [field]: value });
    await expectRefused(surface, completed, `${named} is malformed`);
  });
}

test(`${statement} (an individual carrying every field is accepted)`, async ({ surface }) => {
  await surface.signIn(persona.vendor);
  await proposeAsIndividual(surface, completeIndividual);
  await expect.poll(() => myProposals(surface), settle).toContain(opportunity.title);
});

// The organization owner owns both the archived organization and an active one, so the only
// difference between the two attempts is the organization's status.
test(`${statement} (an archived organization is refused)`, async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await proposeForOrganization(surface, seed.organizations.archived);
  expect(await myProposals(surface), "a proposal was submitted for an archived organization").not.toContain(
    opportunity.title,
  );
});

test(`${statement} (an active organization is accepted)`, async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await proposeForOrganization(surface, seed.organizations.qualified);
  await expect.poll(() => myProposals(surface), settle).toContain(opportunity.title);
});
