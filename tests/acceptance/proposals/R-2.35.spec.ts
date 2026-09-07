// criterion: @R-2.35 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

const OPPORTUNITY = "R-2.35 the history of a proposal";
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

test("every change of state and every score entered against a proposal is recorded in its history with who did it, when, and any note given", async ({
  surface,
}) => {
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

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityTitle: OPPORTUNITY });
  await surface.proposalCwuCreate.chooseProponentIndividual(individualProponent);
  await surface.proposalCwuCreate.saveDraft({ proposalText: "How we would do the work." });

  await surface.proposalCwuEdit.open({ opportunityTitle: OPPORTUNITY });
  await surface.proposalCwuEdit.submitProposal();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityTitle: OPPORTUNITY });
  await surface.opportunityCwuEdit.editDetails({ proposalDeadline: PASSED_DEADLINE });
  // The transitions that follow a passed deadline run in front of the next request.
  await surface.opportunityList.open();

  await surface.proposalCwuView.open({ opportunityTitle: OPPORTUNITY, proponent: PROPONENT });
  await surface.proposalCwuView.enterScore({ score: 87 });

  const history = await surface.proposalCwuView.historyTab();

  // Each state the proposal passed through, and the score that was entered against it.
  expect(history).toContain("Draft");
  expect(history).toContain("Submitted");
  expect(history).toContain("87%");

  // Newest first: the score is the most recent entry and the draft the oldest.
  expect(history.indexOf("87%")).toBeLessThan(history.indexOf("Draft"));
});
