// criterion: @R-2.3 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// vendor-with-terms-reset is the account the criterion's given describes: a vendor who
// accepted the service's terms once and whose acceptance has since been reset. Its legal
// page therefore warns that the terms have changed before the test starts, and stops
// warning once the submission records the fresh acceptance, which is how "the act of
// submitting records that acceptance" is read without looking inside the service.
//
// The second half of the given/when/then — a submission that reaches the service anyway
// being refused — is not asserted. Every submission the surface can make goes through the
// control the first test finds disabled, and nothing in the surface sends a request that
// bypasses it.

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

async function publishOpportunity(surface: Surface, title: string): Promise<string> {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...details, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  await surface.signOut();
  return opportunityId;
}

test("submitting a proposal requires the vendor to accept both the program's terms and the service's current terms", async ({
  surface,
}) => {
  const opportunityId = await publishOpportunity(
    surface,
    "R-2.3 opportunity bid on without agreeing to the terms",
  );

  await surface.signIn(persona.vendorWithTermsReset);
  await surface.proposalCwuCreate.open({ opportunityId });
  await surface.proposalCwuCreate.chooseProponentIndividual();

  expect(await surface.proposalCwuCreate.submitDisabledUntilTermsAccepted()).toBeTruthy();

  await surface.proposalCwuCreate.acceptProgramTerms();
  expect(await surface.proposalCwuCreate.submitDisabledUntilTermsAccepted()).toBeTruthy();
});

test("the act of submitting a proposal records the vendor's acceptance of the terms", async ({
  surface,
}) => {
  const opportunityId = await publishOpportunity(
    surface,
    "R-2.3 opportunity whose submission records an acceptance of the terms",
  );
  const userId = seed.users.vendorWithTermsReset.id;

  await surface.signIn(persona.vendorWithTermsReset);
  await surface.userProfileLegal.open({ userId });
  expect(await surface.userProfileLegal.termsUpdatedWarning()).toBeTruthy();

  await surface.proposalCwuCreate.open({ opportunityId });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A proposal submitted once both sets of terms had been agreed.",
  });

  expect((await surface.proposalCwuEdit.status()).toLowerCase()).toContain("submitted");

  await surface.userProfileLegal.open({ userId });
  expect(await surface.userProfileLegal.acceptedOnNotice()).toBeTruthy();
  expect(await surface.userProfileLegal.termsUpdatedWarning()).toBeFalsy();
});
