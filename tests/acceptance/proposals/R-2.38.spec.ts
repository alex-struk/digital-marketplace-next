// criterion: @R-2.38 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Only the vendor's half of the criterion is reachable. Its given is a closed opportunity,
// and no page, action or observation closes one (see R-1.1); before an opportunity closes,
// staff and administrators may see no proposal against it at all (R-2.25), so the document
// the criterion says they receive would be empty for a reason that has nothing to do with
// who they are. The choice of whether that document names the proponents is out of reach
// with it: the export-all surface carries no action offering the choice and no observation
// of a proponent name.
//
// The vendor bids on the opportunity first, so the refusal is read against an opportunity
// that does carry a proposal — and specifically one the vendor themselves may read
// elsewhere, which makes the refusal a fact about this document rather than about there
// being nothing to put in it.

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

async function publishOpportunity(surface: Surface, title: string): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...details, title });
  await surface.signOut();
}

test("a vendor may not take away every proposal of an opportunity in one document", async ({
  surface,
}) => {
  const title = "R-2.38 opportunity whose vendor asks for every proposal at once";
  const proposalText = "A proposal its own author may read but may not export in bulk.";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunity: title });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({ proposalText });

  await surface.proposalCwuExportOne.open({ opportunity: title });
  expect(await surface.proposalCwuExportOne.exportedProposal()).toContain(proposalText);

  await surface.proposalCwuExportAll.open({ opportunity: title });
  expect(await surface.proposalCwuExportAll.exportedProposal()).not.toContain(proposalText);
});
