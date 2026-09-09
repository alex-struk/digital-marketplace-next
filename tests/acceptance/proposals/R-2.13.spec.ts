// criterion: @R-2.13 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Every test submits the same form, complete in every other respect, and varies one thing:
// the proposal text, the additional comments, or whether a proponent was chosen at all.
// That the same form is accepted when nothing is varied is R-2.7, so a refusal here can
// only be the doing of the field the test changed.
//
// "The offending field is named in the response" is read as the create screen's field
// error being raised. Which field it names is not asserted, because the observation returns
// the screen's errors as one piece of text rather than a field and a message.

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

const tooLong = "word ".repeat(2001).slice(0, 10001);

async function publishOpportunity(surface: Surface, title: string): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...details, title });
  await surface.signOut();
}

async function openProposalForm(surface: Surface, opportunity: string): Promise<void> {
  await surface.proposalCwuCreate.open({ opportunity });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
}

test("a Code With Us proposal that is not a draft is rejected when its proposal text is empty", async ({
  surface,
}) => {
  const title = "R-2.13 opportunity bid on with no proposal text";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await openProposalForm(surface, title);
  await surface.proposalCwuCreate.submitProposal({ proposalText: "" });

  expect(await surface.proposalCwuCreate.fieldError()).toBeTruthy();
});

test("a Code With Us proposal that is not a draft is rejected when its proposal text is longer than 10,000 characters", async ({
  surface,
}) => {
  const title = "R-2.13 opportunity bid on with overlong proposal text";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await openProposalForm(surface, title);
  await surface.proposalCwuCreate.submitProposal({ proposalText: tooLong });

  expect(await surface.proposalCwuCreate.fieldError()).toBeTruthy();
});

test("a Code With Us proposal that is not a draft is rejected when its additional comments are longer than 10,000 characters", async ({
  surface,
}) => {
  const title = "R-2.13 opportunity bid on with overlong additional comments";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await openProposalForm(surface, title);
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A proposal whose text is the right length and whose comments are not.",
    additionalComments: tooLong,
  });

  expect(await surface.proposalCwuCreate.fieldError()).toBeTruthy();
});

test("a Code With Us proposal that is not a draft is rejected when it carries no complete proponent", async ({
  surface,
}) => {
  const title = "R-2.13 opportunity bid on with no proponent";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunity: title });
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A proposal offered without saying who is offering it.",
  });

  expect(await surface.proposalCwuCreate.fieldError()).toBeTruthy();
});
