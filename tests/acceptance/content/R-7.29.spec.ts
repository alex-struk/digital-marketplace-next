// criterion: @R-7.29 v1
// provenance: blind, spec@76d9da180ae1fba4b970cd40bf8a0a55a680eb3e, derived 2026-10-02
import { test, expect, persona, seed } from "../../fixtures";

// Runs only against an instance started in the configuration service_page_absent
// (spec/contract/observables.yaml), where the page seed.content
// .servicePageSprintWithUsOpportunityScope has been removed. Every Sprint With Us
// opportunity's screen embeds that page's body as its scope section; a seeded one is opened
// as a vendor and the rest of the screen is read alongside the empty section.
const statement =
  "Where a screen embeds the body of a page beside its own material, a page that is missing or unreadable leaves that part of the screen empty and the screen otherwise works.";

const settle = { timeout: 15000 };

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

test(statement, { tag: "@service_page_absent" }, async ({ surface }) => {
  const opportunity = seed.opportunities.closedSprintWithUs;

  await surface.signIn(persona.vendor);
  await surface.opportunitySwuView.open({ opportunityId: opportunity.id });

  // The opportunity is shown in full.
  await expect
    .poll(() => readOrEmpty(() => surface.opportunitySwuView.opportunityIdentifier()), settle)
    .toContain(opportunity.id);
  await expect.poll(() => readOrEmpty(() => surface.opportunitySwuView.status()), settle).toMatch(/\S/);
  await expect.poll(() => readOrEmpty(() => surface.opportunitySwuView.proposalDeadline()), settle).toMatch(/\S/);
  await expect
    .poll(() => readOrEmpty(() => surface.opportunitySwuView.totalMaxBudget()), settle)
    .toMatch(/500[,\s.]?000/);
  await expect
    .poll(() => readOrEmpty(() => surface.opportunitySwuView.phases()), settle)
    .toMatch(/implementation/i);

  // The embedded scope page is missing: that section is empty, with nothing said about why.
  // Read directly, so a section the adapter cannot reach fails the test rather than reading
  // as empty.
  expect((await surface.opportunitySwuView.scopeSection()).trim()).toBe("");
});
