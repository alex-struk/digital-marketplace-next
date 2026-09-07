// criterion: @R-2.3 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

const DEADLINE = "2030-06-01T23:59:00Z";

const individualProponent = {
  legalName: "Robin Fielder",
  email: "robin.fielder@example.test",
  street1: "1 Front Street",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8V 1V1",
  country: "Canada",
};

async function publishOpportunity(surface: Surface, title: string) {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    title,
    teaser: "A short description of the work.",
    description: "The work to be done, in full.",
    reward: 5000,
    proposalDeadline: DEADLINE,
    remoteOk: true,
  });
}

// The vendor whose acceptance of the current service terms has been reset, so that the
// two acceptances the criterion names can be told apart.
async function completeProposal(surface: Surface, title: string) {
  await surface.signIn(persona.vendorWithTermsReset);
  await surface.proposalCwuCreate.open({ opportunityTitle: title });
  await surface.proposalCwuCreate.chooseProponentIndividual(individualProponent);
}

test("submitting a proposal requires the vendor to accept both the program's terms and the service's current terms: the submit action is unavailable until both are ticked", async ({
  surface,
}) => {
  const opportunity = "R-2.3 submit unavailable";
  await publishOpportunity(surface, opportunity);
  await completeProposal(surface, opportunity);

  expect(await surface.proposalCwuCreate.submitDisabledUntilTermsAccepted()).toBeTruthy();

  await surface.proposalCwuCreate.acceptProgramTerms();
  expect(await surface.proposalCwuCreate.submitDisabledUntilTermsAccepted()).toBeTruthy();
});

test("submitting a proposal requires the vendor to accept both the program's terms and the service's current terms: a submission that reaches the service anyway is refused", async ({
  surface,
}) => {
  const opportunity = "R-2.3 submission refused";
  await publishOpportunity(surface, opportunity);
  await completeProposal(surface, opportunity);
  await surface.proposalCwuCreate.acceptProgramTerms();

  await expect(
    surface.proposalCwuCreate.submitProposal({
      proposalText: "How we would do the work.",
      additionalComments: "Nothing further.",
    })
  ).rejects.toThrow();
});

test("the act of submitting records the vendor's acceptance of the service's current terms", async ({
  surface,
}) => {
  const opportunity = "R-2.3 acceptance recorded";
  await publishOpportunity(surface, opportunity);
  await completeProposal(surface, opportunity);

  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "How we would do the work.",
    additionalComments: "Nothing further.",
  });

  expect(await surface.proposalCwuEdit.status()).toContain("Submitted");

  await surface.userProfileLegal.open();
  expect(await surface.userProfileLegal.acceptedOnNotice()).toBeTruthy();
  expect(await surface.userProfileLegal.termsUpdatedWarning()).toBeFalsy();
});
