// criterion: @R-2.26 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is the seeded Code With Us opportunity past its proposal deadline carrying one
// submitted proposal. The scheduled transition trigger is requested, and waited on, until the
// opportunity reads as in evaluation, which is what puts its proposal under review. The
// opportunity belongs to the government account, so the public sector staff persona is its
// author, as the criterion's "when" names.
//
// The proposal's own screen offers no observation of its status, so "becomes evaluated" is
// read from its history, which records every change of state; the same history is where the
// criterion says the "87%" is recorded.
//
// The out-of-range scores are their own test. The screen names no observation for a refused
// score, so a refusal is read as nothing having been recorded: no evaluated entry in the
// history and no score shown. A score the form will not let the author enter at all has been
// refused as surely as one the service turns away.

const statement =
  "A Code With Us proposal is scored once out of 100 to two decimal places, and entering that score moves the proposal from review to evaluated.";

const settle = { timeout: 30000 };
const opportunityId = seed.opportunities.cwuLapsedForScoring.id;
const proposalId = seed.proposals.cwuLapsedForScoringOne.id;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function bringUnderReview(surface: Surface): Promise<void> {
  await expect
    .poll(async () => {
      await surface.scheduledTransitionTrigger.open();
      await surface.scheduledTransitionTrigger.runPendingTransitions();
      await surface.opportunityCwuView.open({ opportunityId });
      return (await readOrEmpty(() => surface.opportunityCwuView.status())).toLowerCase();
    }, settle)
    .toMatch(/evaluat/);
}

async function history(surface: Surface): Promise<string> {
  await surface.proposalCwuView.open({ opportunityId, proposalId });
  return readOrEmpty(() => surface.proposalCwuView.historyTab());
}

test(`${statement} (a score of 87)`, async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await bringUnderReview(surface);

  expect((await history(surface)).toLowerCase()).not.toMatch(/evaluated/);

  await surface.proposalCwuView.open({ opportunityId, proposalId });
  await surface.proposalCwuView.enterScore({ score: 87 });

  await expect.poll(async () => (await history(surface)).toLowerCase(), settle).toMatch(/evaluated/);
  expect(await history(surface)).toContain("87%");
});

test(`${statement} (a score above 100, below zero or with more than two decimal places)`, async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await bringUnderReview(surface);

  for (const score of [100.01, 101, -1, 87.125]) {
    await surface.proposalCwuView.open({ opportunityId, proposalId });
    try {
      await surface.proposalCwuView.enterScore({ score });
    } catch {
      // The form would not take it, which is a refusal.
    }

    const after = await history(surface);
    expect(after.toLowerCase(), `a score of ${score} was accepted`).not.toMatch(/evaluated/);
    expect(after, `a score of ${score} was recorded`).not.toContain(`${score}%`);

    await surface.proposalCwuView.open({ opportunityId, proposalId });
    expect(await readOrEmpty(() => surface.proposalCwuView.score()), `a score of ${score} is shown`).not.toContain(
      String(score),
    );
  }
});
