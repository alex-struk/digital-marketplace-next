// criterion: @R-2.36 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface, Persona } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const PASSED_DEADLINE = "2020-01-15T23:59:00Z";

const winner = { who: persona.vendor, proponent: "Robin Fielder", email: seed.users.vendorOne.email };
const other = {
  who: persona.fileUploader,
  proponent: "Sam Harbour",
  email: seed.users.fileUploader.email,
};

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

async function publishOpportunity(surface: Surface, title: string) {
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
}

async function submitProposal(
  surface: Surface,
  title: string,
  bidder: { who: Persona; proponent: string }
) {
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

test("submitting a proposal sends a confirmation to the submitting vendor", async ({
  surface,
  mail,
}) => {
  const title = "R-2.36 a submission confirmation";
  await publishOpportunity(surface, title);

  await mail.clear();
  await submitProposal(surface, title, winner);

  expect(await mail.latestTo(winner.email)).not.toBeNull();
});

test("awarding a proposal sends an award notice to the winner and a decision notice to everyone else", async ({
  surface,
  mail,
}) => {
  const title = "R-2.36 an award notice and a decision notice";
  await publishOpportunity(surface, title);
  await submitProposal(surface, title, winner);
  await submitProposal(surface, title, other);

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityTitle: title });
  await surface.opportunityCwuEdit.editDetails({ proposalDeadline: PASSED_DEADLINE });
  // The transitions that follow a passed deadline run in front of the next request.
  await surface.opportunityList.open();

  for (const bidder of [winner, other]) {
    await surface.proposalCwuView.open({ opportunityTitle: title, proponent: bidder.proponent });
    await surface.proposalCwuView.enterScore({ score: bidder === winner ? 90 : 70 });
  }

  await mail.clear();
  await surface.proposalCwuView.open({ opportunityTitle: title, proponent: winner.proponent });
  await surface.proposalCwuView.awardProposal();

  expect(await mail.latestTo(winner.email)).not.toBeNull();
  expect(await mail.latestTo(other.email)).not.toBeNull();
});

test("withdrawing a proposal sends a notice to the vendor and to every administrator", async ({
  surface,
  mail,
}) => {
  const title = "R-2.36 a withdrawal notice";
  await publishOpportunity(surface, title);
  await submitProposal(surface, title, winner);

  await mail.clear();
  await surface.proposalCwuEdit.open({ opportunityTitle: title });
  await surface.proposalCwuEdit.withdrawProposal();

  expect(await mail.latestTo(winner.email)).not.toBeNull();
  expect(await mail.latestTo(seed.users.administratorOne.email)).not.toBeNull();
});
