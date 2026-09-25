// criterion: @R-2.27 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given — an opportunity in evaluation with two proposals under review and one already
// disqualified — is built on the seeded Code With Us opportunity past its deadline with three
// submitted proposals. The scheduled transition trigger closes it, which puts all three under
// review; the administrator then disqualifies the first, with a reason, and scores the second.
// The opportunity is read as not yet in processing at that point, since one proposal in
// contention is still unscored. Scoring the third is the "when".
//
// The move is read off the opportunity's own view, and the note it carries off the history on
// its management screen.

const statement =
  "When every proposal still in contention on an opportunity has been evaluated, the opportunity moves to processing on its own.";

const note = "Automatically moved to Processing as all proposals have been evaluated.";
const settle = { timeout: 30000 };
const opportunityId = seed.opportunities.cwuLapsedWithThreeProposals.id;
const [disqualified, first, last] = [
  seed.proposals.cwuThreeOne.id,
  seed.proposals.cwuThreeTwo.id,
  seed.proposals.cwuThreeThree.id,
];

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function status(surface: Surface): Promise<string> {
  await surface.opportunityCwuView.open({ opportunityId });
  return (await readOrEmpty(() => surface.opportunityCwuView.status())).toLowerCase();
}

async function history(surface: Surface, proposalId: string): Promise<string> {
  await surface.proposalCwuView.open({ opportunityId, proposalId });
  return (await readOrEmpty(() => surface.proposalCwuView.historyTab())).toLowerCase();
}

test(statement, async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await expect
    .poll(async () => {
      await surface.scheduledTransitionTrigger.open();
      await surface.scheduledTransitionTrigger.runPendingTransitions();
      return status(surface);
    }, settle)
    .toMatch(/evaluat/);

  await surface.proposalCwuView.open({ opportunityId, proposalId: disqualified });
  await surface.proposalCwuView.disqualifyProposal({
    reason: "R-2.27 the proponent withdrew their named developer.",
  });
  await expect.poll(() => history(surface, disqualified), settle).toMatch(/disqualif/);

  await surface.proposalCwuView.open({ opportunityId, proposalId: first });
  await surface.proposalCwuView.enterScore({ score: 80 });
  await expect.poll(() => history(surface, first), settle).toMatch(/evaluated/);
  expect(await status(surface)).not.toMatch(/processing/);

  await surface.proposalCwuView.open({ opportunityId, proposalId: last });
  await surface.proposalCwuView.enterScore({ score: 70 });

  await expect.poll(() => status(surface), settle).toMatch(/processing/);
  await surface.opportunityCwuEdit.open({ opportunityId });
  expect(await surface.opportunityCwuEdit.historyTab()).toContain(note);
});
