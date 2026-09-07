// criterion: @R-2.27 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

const OPPORTUNITY = "R-2.27 every proposal evaluated";
const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const PASSED_DEADLINE = "2020-01-15T23:59:00Z";

const bidders = [
  { who: persona.vendor, proponent: "Robin Fielder" },
  { who: persona.fileUploader, proponent: "Sam Harbour" },
  { who: persona.organizationOwner, proponent: "Alex Wharf" },
];

function individual(legalName: string) {
  return {
    legalName,
    email: "robin.fielder@example.test",
    street1: "1 Front Street",
    city: "Victoria",
    region: "British Columbia",
    mailCode: "V8V 1V1",
    country: "Canada",
  };
}

async function closedOpportunityWithThreeProposals(surface: Surface, title: string) {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    title,
    teaser: "A short description of the work.",
    description: "The work to be done, in full.",
    reward: 5000,
    proposalDeadline: FUTURE_DEADLINE,
    remoteOk: true,
  });

  for (const bidder of bidders) {
    await surface.signIn(bidder.who);
    await surface.proposalCwuCreate.open({ opportunityTitle: title });
    await surface.proposalCwuCreate.chooseProponentIndividual(individual(bidder.proponent));
    await surface.proposalCwuCreate.acceptProgramTerms();
    await surface.proposalCwuCreate.acceptAppTerms();
    await surface.proposalCwuCreate.submitProposal({
      proposalText: "How we would do the work.",
      additionalComments: "Nothing further.",
    });
  }

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityTitle: title });
  await surface.opportunityCwuEdit.editDetails({ proposalDeadline: PASSED_DEADLINE });
  // The transitions that follow a passed deadline run in front of the next request.
  await surface.opportunityList.open();
}

test("when every proposal still in contention on an opportunity has been evaluated, the opportunity moves to processing on its own", async ({
  surface,
}) => {
  await closedOpportunityWithThreeProposals(surface, OPPORTUNITY);

  // One of the three is disqualified, so it is no longer in contention and is not
  // waited for.
  await surface.proposalCwuView.open({
    opportunityTitle: OPPORTUNITY,
    proponent: bidders[2].proponent,
  });
  await surface.proposalCwuView.disqualifyProposal({
    reason: "The proponent withdrew from the market.",
  });

  await surface.proposalCwuView.open({
    opportunityTitle: OPPORTUNITY,
    proponent: bidders[0].proponent,
  });
  await surface.proposalCwuView.enterScore({ score: 80 });

  await surface.opportunityCwuView.open({ opportunityTitle: OPPORTUNITY });
  expect(await surface.opportunityCwuView.status()).not.toContain("Processing");

  await surface.proposalCwuView.open({
    opportunityTitle: OPPORTUNITY,
    proponent: bidders[1].proponent,
  });
  await surface.proposalCwuView.enterScore({ score: 90 });

  await surface.opportunityCwuView.open({ opportunityTitle: OPPORTUNITY });
  expect(await surface.opportunityCwuView.status()).toContain("Processing");

  await surface.opportunityCwuEdit.open({ opportunityTitle: OPPORTUNITY });
  expect(await surface.opportunityCwuEdit.historyTab()).toContain(
    "Automatically moved to Processing as all proposals have been evaluated."
  );
});
