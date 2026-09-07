// criterion: @R-2.33 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

const OPPORTUNITY = "R-2.33 awarding one proposal";
const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const PASSED_DEADLINE = "2020-01-15T23:59:00Z";

const winner = { who: persona.vendor, proponent: "Robin Fielder" };
const disqualified = { who: persona.fileUploader, proponent: "Sam Harbour" };
const withdrawn = { who: persona.organizationOwner, proponent: "Alex Wharf" };
const passedOver = { who: persona.organizationAdmin, proponent: "Jo Cedar" };

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

async function closedOpportunity(surface: Surface) {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    title: OPPORTUNITY,
    teaser: "A short description of the work.",
    description: "The work to be done, in full.",
    reward: 5000,
    proposalDeadline: FUTURE_DEADLINE,
    remoteOk: true,
  });

  for (const bidder of [winner, disqualified, withdrawn, passedOver]) {
    await surface.signIn(bidder.who);
    await surface.proposalCwuCreate.open({ opportunityTitle: OPPORTUNITY });
    await surface.proposalCwuCreate.chooseProponentIndividual(individual(bidder.proponent));
    await surface.proposalCwuCreate.acceptProgramTerms();
    await surface.proposalCwuCreate.acceptAppTerms();
    await surface.proposalCwuCreate.submitProposal({
      proposalText: "How we would do the work.",
      additionalComments: "Nothing further.",
    });
  }

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityTitle: OPPORTUNITY });
  await surface.opportunityCwuEdit.editDetails({ proposalDeadline: PASSED_DEADLINE });
  // The transitions that follow a passed deadline run in front of the next request.
  await surface.opportunityList.open();
}

test("awarding a proposal marks every other proposal still in contention on that opportunity as not awarded and awards the opportunity itself", async ({
  surface,
}) => {
  await closedOpportunity(surface);

  await surface.signIn(withdrawn.who);
  await surface.proposalCwuEdit.open({ opportunityTitle: OPPORTUNITY });
  await surface.proposalCwuEdit.withdrawProposal();

  await surface.signIn(persona.administrator);
  await surface.proposalCwuView.open({
    opportunityTitle: OPPORTUNITY,
    proponent: disqualified.proponent,
  });
  await surface.proposalCwuView.disqualifyProposal({
    reason: "The proponent is not eligible for this work.",
  });

  for (const scored of [winner, passedOver]) {
    await surface.proposalCwuView.open({
      opportunityTitle: OPPORTUNITY,
      proponent: scored.proponent,
    });
    await surface.proposalCwuView.enterScore({ score: scored === winner ? 90 : 70 });
  }

  await surface.proposalCwuView.open({
    opportunityTitle: OPPORTUNITY,
    proponent: winner.proponent,
  });
  await surface.proposalCwuView.awardProposal();

  expect(await surface.proposalCwuView.proposalTab()).toContain("Awarded");

  await surface.opportunityCwuView.open({ opportunityTitle: OPPORTUNITY });
  expect(await surface.opportunityCwuView.status()).toContain("Awarded");

  // The one still in contention is passed over; the other two keep the state they were in.
  await surface.proposalCwuView.open({
    opportunityTitle: OPPORTUNITY,
    proponent: passedOver.proponent,
  });
  expect(await surface.proposalCwuView.proposalTab()).toContain("Not Awarded");

  await surface.proposalCwuView.open({
    opportunityTitle: OPPORTUNITY,
    proponent: disqualified.proponent,
  });
  expect(await surface.proposalCwuView.proposalTab()).toContain("Disqualified");

  await surface.signIn(withdrawn.who);
  await surface.proposalCwuEdit.open({ opportunityTitle: OPPORTUNITY });
  expect(await surface.proposalCwuEdit.status()).toContain("Withdrawn");
});
