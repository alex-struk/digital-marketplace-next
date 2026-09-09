// criterion: @R-2.14 v2
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// A refused submission creates nothing, so every attempt in a test can be made against the
// same opportunity; only the one accepted submission at the end of the second test needs an
// opportunity of its own to be the first proposal on.
//
// The second test is the criterion's own account of what an organization proponent is
// checked for. The vendor persona belongs to no organization but the unqualified one it
// owns, and it names the qualified organization — which it is not a member of — and is
// taken at its word, which is the "does not verify that the vendor belongs to the
// organization" half read from outside. The archived organization is the other half:
// existence is not enough, the organization has to be active.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const details = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  reward: 5000,
  skills: ["Backend Development"],
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(35),
};

// The address fields are named as the organization registration form names them, since one
// adapter stands behind both and the street address, city, province, postal code and
// country the criterion lists are the same five things that form asks for.
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

async function publishOpportunity(surface: Surface, title: string): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...details, title });
  await surface.signOut();
}

test("a Code With Us proponent named as an individual carries a legal name, an email address and a full postal address, each field validated in turn", async ({
  surface,
}) => {
  const title = "R-2.14 opportunity bid on by an incomplete individual";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);

  const required = [
    "legalName",
    "email",
    "streetAddress",
    "city",
    "region",
    "mailCode",
    "country",
  ] as const;

  for (const field of required) {
    await surface.proposalCwuCreate.open({ opportunity: title });
    await surface.proposalCwuCreate.chooseProponentIndividual({
      ...completeIndividual,
      [field]: "",
    });
    await surface.proposalCwuCreate.acceptProgramTerms();
    await surface.proposalCwuCreate.acceptAppTerms();
    await surface.proposalCwuCreate.submitProposal({
      proposalText: `A proposal offered by an individual with no ${field}.`,
    });
    expect(await surface.proposalCwuCreate.fieldError()).toBeTruthy();
  }

  await surface.proposalCwuCreate.open({ opportunity: title });
  await surface.proposalCwuCreate.chooseProponentIndividual({
    ...completeIndividual,
    email: "not-an-email-address",
  });
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A proposal offered by an individual whose email address is malformed.",
  });
  expect(await surface.proposalCwuCreate.fieldError()).toBeTruthy();

  await surface.proposalCwuCreate.open({ opportunity: title });
  await surface.proposalCwuCreate.chooseProponentIndividual({
    ...completeIndividual,
    phone: "not a phone number",
  });
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A proposal offered by an individual whose phone number is malformed.",
  });
  expect(await surface.proposalCwuCreate.fieldError()).toBeTruthy();
});

test("a Code With Us proponent named as an organization is checked only for existence and active status", async ({
  surface,
}) => {
  const title = "R-2.14 opportunity bid on by an organization the vendor does not belong to";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);

  await surface.proposalCwuCreate.open({ opportunity: title });
  await surface.proposalCwuCreate.chooseProponentOrganization({
    organization: seed.organizations.archived,
  });
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A proposal offered for an organization that has been archived.",
  });
  expect(await surface.proposalCwuCreate.fieldError()).toBeTruthy();

  await surface.proposalCwuCreate.open({ opportunity: title });
  await surface.proposalCwuCreate.chooseProponentOrganization({
    organization: seed.organizations.qualified,
  });
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A proposal offered for an active organization the vendor is not a member of.",
  });
  expect(await surface.proposalCwuCreate.fieldError()).toBeFalsy();

  await surface.proposalCwuEdit.open({ opportunity: title });
  expect((await surface.proposalCwuEdit.status()).toLowerCase()).toContain("submitted");
});
