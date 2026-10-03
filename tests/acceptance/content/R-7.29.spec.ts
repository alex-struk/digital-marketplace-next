// criterion: @R-7.29 v1
// provenance: blind, spec@76d9da180ae1fba4b970cd40bf8a0a55a680eb3e, derived 2026-10-03
import { test, expect, persona, seed } from "../../fixtures";

// Each test runs only against an instance started in the configuration its tag names
// (spec/contract/observables.yaml), where one page the service embeds has been removed:
//   @service_page_absent                 the Sprint With Us opportunity scope page, embedded
//                                        as opportunity-swu-view's scope section;
//   @evaluation_instructions_absent_swu  the Sprint With Us evaluation instructions page,
//                                        embedded as evaluation-instructions-swu's body;
//   @evaluation_instructions_absent_twu  its Team With Us sibling.
// The criterion is one statement about every screen that embeds a page, and each removal
// needs its own instance, so each screen is its own test, titled with the statement and the
// screen it is about.
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

test(`${statement} (Sprint With Us opportunity, scope)`, { tag: "@service_page_absent" }, async ({ surface }) => {
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

  // The embedded scope page is missing: that section is empty. Read directly, so a section
  // the adapter cannot reach fails the test rather than reading as empty.
  expect((await surface.opportunitySwuView.scopeSection()).trim()).toBe("");

  // Nothing is said about why: the screen shows no notice, alert or error message outside
  // its sections. For this opportunity opened by this vendor none is shown when the page is
  // present, so any message here is one the missing page caused. Read directly.
  expect((await surface.opportunitySwuView.pageMessages()).trim()).toBe("");
});

test(
  `${statement} (Sprint With Us evaluation instructions)`,
  { tag: "@evaluation_instructions_absent_swu" },
  async ({ surface }) => {
    const opportunityId = seed.opportunities.closedSprintWithUs.id;

    // The seeded opportunity's deadline has passed; the application closes it into
    // evaluation, where its panel works from the instructions.
    await surface.scheduledTransitionTrigger.open();
    await surface.scheduledTransitionTrigger.runPendingTransitions();

    // persona.publicSectorStaff signs in as users.staffOne, an evaluator on its panel.
    await surface.signIn(persona.publicSectorStaff);
    await surface.evaluationInstructionsSwu.open({ opportunityId });

    // The screen still loads around the missing page: its instructions tab is offered.
    await expect
      .poll(() => readOrEmpty(() => surface.evaluationInstructionsSwu.visibleToEvaluatorsOnly()), settle)
      .toMatch(/\S/);

    // The embedded instructions page is missing: its body is empty. Read directly.
    expect((await surface.evaluationInstructionsSwu.instructionsBody()).trim()).toBe("");
  },
);

test(
  `${statement} (Team With Us evaluation instructions)`,
  { tag: "@evaluation_instructions_absent_twu" },
  async ({ surface }) => {
    const opportunityId = seed.opportunities.closedTeamWithUs.id;

    await surface.scheduledTransitionTrigger.open();
    await surface.scheduledTransitionTrigger.runPendingTransitions();

    // persona.publicSectorStaff signs in as users.staffOne, an evaluator on its panel.
    await surface.signIn(persona.publicSectorStaff);
    await surface.evaluationInstructionsTwu.open({ opportunityId });

    await expect
      .poll(() => readOrEmpty(() => surface.evaluationInstructionsTwu.visibleToEvaluatorsOnly()), settle)
      .toMatch(/\S/);

    expect((await surface.evaluationInstructionsTwu.instructionsBody()).trim()).toBe("");
  },
);
