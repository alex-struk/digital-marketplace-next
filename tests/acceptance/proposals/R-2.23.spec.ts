// criterion: @R-2.23 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const PASSED_DEADLINE = "2020-01-15T23:59:00Z";

const individualProponent = {
  legalName: "Robin Fielder",
  email: "robin.fielder@example.test",
  street1: "1 Front Street",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8V 1V1",
  country: "Canada",
};

async function submittedProposal(surface: Surface, title: string) {
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
}

test("a vendor may withdraw a submitted proposal and put it back in while the opportunity is still accepting proposals", async ({
  surface,
}) => {
  const title = "R-2.23 withdrawn before the deadline";
  await submittedProposal(surface, title);

  await surface.proposalCwuEdit.open({ opportunityTitle: title });
  await surface.proposalCwuEdit.withdrawProposal();
  expect(await surface.proposalCwuEdit.status()).toContain("Withdrawn");

  await surface.proposalCwuEdit.submitProposal();
  expect(await surface.proposalCwuEdit.status()).toContain("Submitted");
});

test("a vendor may withdraw a submitted proposal after the deadline, but may not put it back in", async ({
  surface,
}) => {
  const title = "R-2.23 withdrawn after the deadline";
  await submittedProposal(surface, title);

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityTitle: title });
  await surface.opportunityCwuEdit.editDetails({ proposalDeadline: PASSED_DEADLINE });
  // The transitions that follow a passed deadline run in front of the next request.
  await surface.opportunityList.open();

  await surface.signIn(persona.vendor);
  await surface.proposalCwuEdit.open({ opportunityTitle: title });
  await surface.proposalCwuEdit.withdrawProposal();
  expect(await surface.proposalCwuEdit.status()).toContain("Withdrawn");

  await expect(surface.proposalCwuEdit.submitProposal()).rejects.toThrow();
  expect(await surface.proposalCwuEdit.status()).toContain("Withdrawn");
});
