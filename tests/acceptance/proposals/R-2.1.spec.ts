// criterion: @R-2.1 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

const publishedOpportunity = { opportunityId: seed.opportunities.publishedCodeWithUs.id };

test("only a signed-in vendor may start a proposal: an anonymous visitor is refused", async ({ surface }) => {
  await surface.opportunityCwuView.open(publishedOpportunity);

  await expect(surface.opportunityCwuView.startProposal()).rejects.toThrow();
  await expect(surface.proposalCwuCreate.open(publishedOpportunity)).rejects.toThrow();
});

test("only a signed-in vendor may start a proposal: public sector staff are refused", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuView.open(publishedOpportunity);

  await expect(surface.opportunityCwuView.startProposal()).rejects.toThrow();
  await expect(surface.proposalCwuCreate.open(publishedOpportunity)).rejects.toThrow();
});

test("only a signed-in vendor may start a proposal: an administrator is refused", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuView.open(publishedOpportunity);

  await expect(surface.opportunityCwuView.startProposal()).rejects.toThrow();
  await expect(surface.proposalCwuCreate.open(publishedOpportunity)).rejects.toThrow();
});

test("only a signed-in vendor may start a proposal: a vendor is offered the proposal form", async ({ surface }) => {
  await surface.signIn(persona.vendor);
  await surface.opportunityCwuView.open(publishedOpportunity);
  await surface.opportunityCwuView.startProposal();

  expect(await surface.proposalCwuCreate.opportunitySummary()).toContain(
    seed.opportunities.publishedCodeWithUs.title
  );
});
