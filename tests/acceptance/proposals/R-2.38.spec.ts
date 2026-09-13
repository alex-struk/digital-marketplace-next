// criterion: @R-2.38 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The first test bids on the opportunity before asking for the document, so the refusal is
// read against an opportunity that does carry a proposal — and specifically one the vendor
// themselves may read elsewhere, which makes the refusal a fact about this document rather
// than about there being nothing to put in it.
//
// The second test is the other side of the same claim on the seeded Sprint With Us
// opportunity, which the service's own deadline hook closes when run_pending_transitions is
// asked for. It reads and changes nothing. Both readers the criterion names are exercised:
// the opportunity's own author and an administrator, against the same vendor who is refused.
//
// The choice of whether that document names the proponents is not asserted. The export-all
// surfaces carry no action that offers the choice and no observation of a proponent name,
// so a document with the proponents named and one without cannot be told apart, or even
// separately asked for.

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

async function closeOverdueOpportunities(surface: Surface): Promise<void> {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
}

async function publishOpportunity(surface: Surface, title: string): Promise<string> {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...details, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  await surface.signOut();
  return opportunityId;
}

test("a vendor may not take away every proposal of an opportunity in one document", async ({
  surface,
}) => {
  const proposalText = "A proposal its own author may read but may not export in bulk.";
  const opportunityId = await publishOpportunity(
    surface,
    "R-2.38 opportunity whose vendor asks for every proposal at once",
  );

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityId });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({ proposalText });
  const proposalId = await surface.proposalCwuEdit.proposalIdentifier();

  await surface.proposalCwuExportOne.open({ opportunityId, proposalId });
  expect(await surface.proposalCwuExportOne.exportedProposal()).toContain(proposalText);

  await surface.proposalCwuExportAll.open({ opportunityId });
  expect(await surface.proposalCwuExportAll.exportedProposal()).not.toContain(proposalText);
});

test("public sector staff and administrators may take away every proposal of a closed opportunity in one document", async ({
  surface,
}) => {
  await closeOverdueOpportunities(surface);

  const opportunityId = seed.opportunities.closedSprintWithUs.id;

  await surface.signIn(persona.publicSectorStaff);
  await surface.proposalSwuExportAll.open({ opportunityId });
  expect(await surface.proposalSwuExportAll.exportedProposal()).toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.proposalSwuExportAll.open({ opportunityId });
  expect(await surface.proposalSwuExportAll.exportedProposal()).toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.organizationOwner);
  await surface.proposalSwuExportAll.open({ opportunityId });
  expect(await surface.proposalSwuExportAll.exportedProposal()).toBeFalsy();
});
