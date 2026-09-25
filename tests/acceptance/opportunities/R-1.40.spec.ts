// criterion: @R-1.40 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";

// The given is an opportunity that has been evaluated. The seed carries a Code With Us
// opportunity already awarded, with its two proposals — Northern Pines's, which won, and Silver
// Creek's — and its history of state changes behind it. It carries no addendum, so the
// administrator adds one first, and the report is then expected to carry it.
//
// The member of public sector staff who asks is the opportunity's own author, the person most
// likely to be let in if anybody other than an administrator were; they are shown nothing. The
// administrator is shown one report carrying the opportunity (its title), its addendum, its
// history (the publication it went through) and every proposal (both proponents by name).

const statement =
  "Only an administrator can open the full report of a completed opportunity, which shows the opportunity, its addenda, its history and every proposal in one continuous document.";

const settle = { timeout: 15000 };
const opportunity = seed.opportunities.cwuAwarded;
const addendum = "R-1.40 an addendum added to the awarded opportunity before its report was opened.";

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

test(`${statement} (a member of public sector staff who is not an administrator is refused)`, async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfileSelf.open();
  expect((await surface.userProfileSelf.accountType()).toLowerCase()).not.toContain("admin");

  await surface.opportunityCwuComplete.open({ opportunityId: opportunity.id });

  expect(await readOrEmpty(() => surface.opportunityCwuComplete.fullReport())).toBeFalsy();
});

test(`${statement} (an administrator is shown the whole record in one document)`, async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuView.open({ opportunityId: opportunity.id });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).toMatch(/awarded/);

  await surface.opportunityCwuEdit.open({ opportunityId: opportunity.id });
  await surface.opportunityCwuEdit.addAddendum({ text: addendum });
  await surface.opportunityCwuView.open({ opportunityId: opportunity.id });
  await expect.poll(() => readOrEmpty(() => surface.opportunityCwuView.addenda()), settle).toContain(addendum);

  await surface.opportunityCwuComplete.open({ opportunityId: opportunity.id });
  await expect.poll(() => readOrEmpty(() => surface.opportunityCwuComplete.fullReport()), settle).toBeTruthy();
  const report = await surface.opportunityCwuComplete.fullReport();

  expect(report).toContain(opportunity.title);
  expect(report).toContain(addendum);
  expect(report).toMatch(/publish/i);
  expect(report).toContain(seed.organizations.qualified.legal_name);
  expect(report).toContain(seed.organizations.proponentTwo.legal_name);
});
