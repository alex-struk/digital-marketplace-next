// criterion: @R-2.17 v1
// provenance: blind, spec@ccc1cba3290f5ea17351e4f2ca49bd80fefc2ef6, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The proposal goes to the service through proposal-team-request, sent as a submission, so
// that what comes back is the service's own answer to that submission, not whatever the form
// lets through. Each test waits for that answer before reading anything, and reads the refusal
// out of it.
//
// Service areas: the given is an organization that is a qualified Team With Us supplier and
// does not provide a service area the opportunity calls for. The seed's organizations.proponentTwo
// is exactly that: its Team With Us terms are accepted and the only service area it provides is
// Full Stack Developer. Its owner, users.proponentTwo (persona.competingVendor), is its one
// active member, so naming them on the team is sound. The opportunity each test publishes calls
// for one resource, an Agile Coach, which that organization does not provide.
//
// Qualified supplier: the organization must provide the service area and not be qualified, so
// that the qualification is the only thing wrong. The seed holds no such organization, so the
// test builds one: its owner registers it, an administrator approves it for Full Stack
// Developer, and nobody accepts its Team With Us terms. The opportunity calls for a Full Stack
// Developer.

const statement =
  "A Team With Us proposal may only be submitted on behalf of an organization that is a qualified supplier for that program and that provides every service area the opportunity's resources call for.";

const serviceAreaRefusal = "The selected organization does not satisfy this opportunity's service areas.";

const settle = { timeout: 30000 };

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

const panel = {
  members: [seed.users.staffOne, seed.users.staffPanelEvaluator],
  chair: seed.users.staffPanelEvaluator,
};

async function publishTeamOpportunity(surface: Surface, title: string, serviceArea: string): Promise<string> {
  await surface.signIn(persona.administrator);
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResource({ serviceArea, targetAllocation: 100, order: 0 });
  await surface.opportunityTwuCreate.addResourceQuestion({
    question: "Describe how your resource has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunityTwuCreate.setEvaluationPanel(panel);
  await surface.opportunityTwuCreate.publish({
    teaser: "A short summary of the work to be done.",
    location: "Victoria",
    description: "A full description of the work to be done.",
    remoteOk: true,
    remoteDescription: "Remote work is acceptable anywhere in the province.",
    proposalDeadline: inDays(14),
    assignmentDate: inDays(21),
    startDate: inDays(28),
    completionDate: inDays(90),
    maxBudget: 1000000,
    questionsWeight: 40,
    challengeWeight: 40,
    priceWeight: 20,
    title,
  });
  await expect
    .poll(() => readOrEmpty(() => surface.opportunityTwuEdit.opportunityIdentifier()), settle)
    .toBeTruthy();
  const opportunityId = await surface.opportunityTwuEdit.opportunityIdentifier();
  await surface.signOut();
  return opportunityId;
}

async function submit(
  surface: Surface,
  opportunityId: string,
  organization: unknown,
  member: unknown,
  resource: string,
): Promise<void> {
  await surface.proposalTeamRequest.open({ program: "team-with-us" });
  await surface.proposalTeamRequest.submitTeamProposal({
    opportunityId,
    organization,
    team: [{ member, resource, hourlyRate: 100 }],
    answers: [
      { order: 0, response: "Our resource built and ran the same kind of service for a Crown corporation." },
    ],
  });
}

// The service answered the submission, one way or the other.
async function answered(surface: Surface): Promise<void> {
  await expect
    .poll(
      async () =>
        (await readOrEmpty(() => surface.proposalTeamRequest.requestAccepted())) ||
        (await readOrEmpty(() => surface.proposalTeamRequest.refusalStatus())),
      { ...settle, message: "the service answered the submission" },
    )
    .toBeTruthy();
}

test(`${statement} (an organization that does not provide a service area the opportunity calls for is refused)`, async ({
  surface,
}) => {
  test.setTimeout(180000);
  const opportunityId = await publishTeamOpportunity(
    surface,
    "R-2.17 opportunity calling for a service area its bidder does not provide",
    "Agile Coach",
  );

  await surface.signIn(persona.competingVendor);
  await submit(surface, opportunityId, seed.organizations.proponentTwo, seed.users.proponentTwo, "Agile Coach");
  await answered(surface);

  expect(
    await readOrEmpty(() => surface.proposalTeamRequest.requestAccepted()),
    "a submission naming an organization without the opportunity's service area was accepted",
  ).toBeFalsy();
  expect(await readOrEmpty(() => surface.proposalTeamRequest.refusalMessages())).toContain(serviceAreaRefusal);
});

test(`${statement} (an organization that is not a qualified Team With Us supplier is refused)`, async ({ surface }) => {
  test.setTimeout(240000);
  const legalName = "R-2.17 Full Stack Provider Without Accepted Terms Ltd.";

  await surface.signIn(persona.organizationOwner);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization({
    legalName,
    streetAddress: "40 Marine Way",
    addressLineTwo: "",
    city: "Victoria",
    region: "British Columbia",
    mailCode: "V8V1V1",
    country: "Canada",
    contactName: "Qualification Test Contact",
    contactTitle: "",
    contactEmail: "unqualified.provider@example.test",
    contactPhone: "",
    website: "",
  });
  await expect
    .poll(() => readOrEmpty(() => surface.organizationEdit.organizationIdentifier()), settle)
    .toBeTruthy();
  const orgId = await surface.organizationEdit.organizationIdentifier();

  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId });
  await surface.organizationEdit.editServiceAreas();
  await surface.organizationEdit.saveServiceAreas({
    serviceAreas: [seed.organizations.qualified.service_areas[0]],
  });
  await surface.signOut();

  const opportunityId = await publishTeamOpportunity(
    surface,
    "R-2.17 opportunity bid on by an organization that is not a qualified supplier",
    "Full Stack Developer",
  );

  await surface.signIn(persona.organizationOwner);
  await submit(
    surface,
    opportunityId,
    { id: orgId, legal_name: legalName, legalName },
    seed.users.organizationOwner,
    "Full Stack Developer",
  );
  await answered(surface);

  expect(
    await readOrEmpty(() => surface.proposalTeamRequest.requestAccepted()),
    "a submission naming an organization that is not a qualified supplier was accepted",
  ).toBeFalsy();
  expect(await readOrEmpty(() => surface.proposalTeamRequest.refusalMessages())).toBeTruthy();
});
