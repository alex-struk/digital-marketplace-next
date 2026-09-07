// criterion: @R-2.34 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const PASSED_DEADLINE = "2020-01-15T23:59:00Z";
const PROPONENT = "Robin Fielder";
const REASON = "The proponent is not eligible for this work.";
const TOO_LONG_REASON = "a".repeat(5001);

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

test("disqualifying a proposal requires a written reason of 1 to 5,000 characters", async ({
  surface,
}) => {
  await proposalUnderReview(surface, "R-2.34 disqualified without a reason");

  await expect(surface.proposalCwuView.disqualifyProposal({ reason: "" })).rejects.toThrow();
  await expect(
    surface.proposalCwuView.disqualifyProposal({ reason: TOO_LONG_REASON })
  ).rejects.toThrow();

  expect(await surface.proposalCwuView.proposalTab()).not.toContain("Disqualified");
});

test("a proposal may be disqualified at any stage of evaluation, and the reason is kept in its history", async ({
  surface,
}) => {
  await proposalUnderReview(surface, "R-2.34 disqualified with a reason");

  await surface.proposalCwuView.disqualifyProposal({ reason: REASON });

  expect(await surface.proposalCwuView.proposalTab()).toContain("Disqualified");
  expect(await surface.proposalCwuView.historyTab()).toContain(REASON);
});
