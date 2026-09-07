// criterion: @R-2.26 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const PASSED_DEADLINE = "2020-01-15T23:59:00Z";
const PROPONENT = "Robin Fielder";

const individualProponent = {
  legalName: PROPONENT,
  email: "robin.fielder@example.test",
  street1: "1 Front Street",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8V 1V1",
  country: "Canada",
};

async function proposalUnderReview(surface: Surface, title: string) {
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

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityTitle: title });
  await surface.proposalCwuCreate.chooseProponentIndividual(individualProponent);
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "How we would do the work.",
    additionalComments: "Nothing further.",
  });

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityTitle: title });
  await surface.opportunityCwuEdit.editDetails({ proposalDeadline: PASSED_DEADLINE });
  // The transitions that follow a passed deadline run in front of the next request.
  await surface.opportunityList.open();

  await surface.proposalCwuView.open({ opportunityTitle: title, proponent: PROPONENT });
}

test("a Code With Us proposal is scored once out of 100, and entering that score moves the proposal from review to evaluated", async ({
  surface,
}) => {
  const title = "R-2.26 a score of 87";
  await proposalUnderReview(surface, title);

  await surface.proposalCwuView.enterScore({ score: 87 });

  expect(await surface.proposalCwuView.proposalTab()).toContain("Evaluated");
  expect(await surface.proposalCwuView.score()).toContain("87");
  expect(await surface.proposalCwuView.historyTab()).toContain("87%");
});

test("a Code With Us score above 100 or below zero is refused", async ({ surface }) => {
  const title = "R-2.26 a score outside the range";
  await proposalUnderReview(surface, title);

  await expect(surface.proposalCwuView.enterScore({ score: 101 })).rejects.toThrow();
  await expect(surface.proposalCwuView.enterScore({ score: -1 })).rejects.toThrow();
  expect(await surface.proposalCwuView.proposalTab()).not.toContain("Evaluated");
});

test("a Code With Us score with more than two decimal places is refused", async ({ surface }) => {
  const title = "R-2.26 a score with three decimal places";
  await proposalUnderReview(surface, title);

  await expect(surface.proposalCwuView.enterScore({ score: 87.123 })).rejects.toThrow();

  await surface.proposalCwuView.enterScore({ score: 87.12 });
  expect(await surface.proposalCwuView.proposalTab()).toContain("Evaluated");
});
