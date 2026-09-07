// criterion: @R-2.12 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";

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

test("a proposal saved as a draft is accepted however incomplete it is", async ({ surface }) => {
  const title = "R-2.12 incomplete draft";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityTitle: title });
  // Nothing is filled in: no proponent, no proposal text, no comments.
  await surface.proposalCwuCreate.saveDraft({});

  expect(await surface.proposalCwuCreate.fieldError()).toBeFalsy();

  await surface.proposalCwuEdit.open({ opportunityTitle: title });
  expect(await surface.proposalCwuEdit.status()).toContain("Draft");
});

test("a draft proposal's attachments are checked even in draft", async ({ surface }) => {
  const title = "R-2.12 draft attachment checked";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityTitle: title });
  await surface.proposalCwuCreate.addAttachment({
    fileName: "never-uploaded.pdf",
    uploaded: false,
  });
  await surface.proposalCwuCreate.saveDraft({});

  expect(await surface.proposalCwuCreate.fieldError()).toBeTruthy();

  await surface.proposalVendorDashboard.open();
  await surface.proposalVendorDashboard.showMyProposals();
  expect(await surface.proposalVendorDashboard.myProposalsTable()).not.toContain(title);
});
