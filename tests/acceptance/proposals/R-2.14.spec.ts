// criterion: @R-2.14 v2
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each test publishes a Code With Us opportunity of its own, under a title nobody else uses, so
// that "no proposal was submitted" can be read off the vendor's own list of proposals: a
// refused attempt leaves that title off the list, and the one accepted attempt at the end of
// each test puts it there, which shows the list is being read at all.
//
// What counts as refused. The criterion promises the submission is rejected. A form that
// withholds the submission — the submit control stays unavailable, or the action cannot be
// completed — has rejected it just as surely as a reply from the service would, so an action
// that cannot be carried out is read as the refusal and the test goes on to confirm nothing
// was submitted. Where a malformed value was typed the service has something to name, so the
// test waits for a reason to be shown. An archived organization that the form does not offer
// as a choice has been refused in the same way.

const statement =
  "A Code With Us proponent is either a named individual carrying a legal name, an email address and a full postal address, each field validated in turn, or an organization identified by id and checked only for existence and active status, since the service does not verify that the vendor belongs to the organization they name.";

const settle = { timeout: 15000 };

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

async function publishOpportunity(surface: Surface, title: string): Promise<string> {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...details, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  await surface.signOut();
  return opportunityId;
}

// Carries out one attempt, returning whether every step could be taken. A step the form will
// not let the vendor take is the form refusing the submission.
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

async function submitAsIndividual(
  surface: Surface,
  opportunityId: string,
  individual: Record<string, string>,
  proposalText: string,
): Promise<boolean> {
  return attempt([
    () => surface.proposalCwuCreate.open({ opportunityId }),
    () => surface.proposalCwuCreate.chooseProponentIndividual(individual),
    () => surface.proposalCwuCreate.acceptProgramTerms(),
    () => surface.proposalCwuCreate.acceptAppTerms(),
    () => surface.proposalCwuCreate.submitProposal({ proposalText }),
  ]);
}

test(`${statement} (a named individual)`, async ({ surface }) => {
  const title = "R-2.14 opportunity bid on by an individual";
  const opportunityId = await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);

  const missing = ["legalName", "email", "streetAddress", "city", "region", "mailCode", "country"];
  for (const field of missing) {
    await submitAsIndividual(
      surface,
      opportunityId,
      { ...completeIndividual, [field]: "" },
      `A proposal offered by an individual with no ${field}.`,
    );
    expect(await myProposals(surface), `submitted with no ${field}`).not.toContain(title);
  }

  const malformed = { email: "not-an-email-address", phone: "not a phone number" };
  for (const [field, value] of Object.entries(malformed)) {
    const completed = await submitAsIndividual(
      surface,
      opportunityId,
      { ...completeIndividual, [field]: value },
      `A proposal offered by an individual whose ${field} is malformed.`,
    );
    if (completed) {
      await expect
        .poll(() => readOrEmpty(() => surface.proposalCwuCreate.fieldError()), settle)
        .toBeTruthy();
    }
    expect(await myProposals(surface), `submitted with a malformed ${field}`).not.toContain(title);
  }

  await submitAsIndividual(
    surface,
    opportunityId,
    completeIndividual,
    "A proposal offered by an individual with every field complete.",
  );
  await expect.poll(() => myProposals(surface), settle).toContain(title);
});

test(`${statement} (an organization)`, async ({ surface }) => {
  const title = "R-2.14 opportunity bid on by an organization";
  const opportunityId = await publishOpportunity(surface, title);

  // The vendor persona owns one active organization and none that is archived; the archived
  // organization the seed carries exists, so what refuses it is its status alone.
  await surface.signIn(persona.vendor);

  await attempt([
    () => surface.proposalCwuCreate.open({ opportunityId }),
    () =>
      surface.proposalCwuCreate.chooseProponentOrganization({
        organization: seed.organizations.archived,
      }),
    () => surface.proposalCwuCreate.acceptProgramTerms(),
    () => surface.proposalCwuCreate.acceptAppTerms(),
    () =>
      surface.proposalCwuCreate.submitProposal({
        proposalText: "A proposal offered for an organization that has been archived.",
      }),
  ]);
  expect(await myProposals(surface), "submitted for an archived organization").not.toContain(title);

  await attempt([
    () => surface.proposalCwuCreate.open({ opportunityId }),
    () =>
      surface.proposalCwuCreate.chooseProponentOrganization({
        organization: seed.organizations.unqualified,
      }),
    () => surface.proposalCwuCreate.acceptProgramTerms(),
    () => surface.proposalCwuCreate.acceptAppTerms(),
    () =>
      surface.proposalCwuCreate.submitProposal({
        proposalText: "A proposal offered for an active organization.",
      }),
  ]);
  await expect.poll(() => myProposals(surface), settle).toContain(title);
});
