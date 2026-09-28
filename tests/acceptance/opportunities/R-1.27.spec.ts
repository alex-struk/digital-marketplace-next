// criterion: @R-1.27 v1
// provenance: blind, spec@7eb305e85acb5a44b285f09b9800da3c65c6a355, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The seed carries an opportunity already awarded to Northern Pines in Code With Us and in
// Sprint With Us. Each is looked at twice:
//
//   - by a visitor who is not signed in, who may not see any proposal's score: the successful
//     proponent's name is shown, and neither their contact details nor their score is shown
//     anywhere the visitor can reach — the opportunity itself or the winning proposal;
//   - by an administrator, who may see every proposal's score: the name is shown, and the
//     contact details and the score are shown wherever the administrator is shown the
//     successful proposal.
//
// That the opportunity is awarded is established by the successful proponent being named,
// not by the word its status is shown with, so nothing withheld can be put down to the award
// not having been made.

const statement =
  "An awarded opportunity shows its successful proponent's name to everyone, and shows the proponent's contact details and score only to those permitted to see the proposal's score.";

const settle = { timeout: 15000 };
const winner = seed.organizations.qualified.legal_name;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

type View = Surface["opportunityCwuView"] | Surface["opportunitySwuView"];

interface Program {
  name: string;
  opportunityId: string;
  view: (surface: Surface) => View;
  // Opens the winning proposal and reads the score it shows, or "" where nothing is shown.
  winningProposalScore: (surface: Surface) => Promise<string>;
}

const programs: Program[] = [
  {
    name: "Code With Us",
    opportunityId: seed.opportunities.cwuAwarded.id,
    view: (surface) => surface.opportunityCwuView,
    winningProposalScore: async (surface) => {
      const proposal = surface.proposalCwuView;
      try {
        await proposal.open({ opportunityId: seed.opportunities.cwuAwarded.id, proposalId: seed.proposals.cwuAwardedWinner.id });
      } catch {
        return "";
      }
      return readOrEmpty(() => proposal.score());
    },
  },
  {
    name: "Sprint With Us",
    opportunityId: seed.opportunities.swuAwarded.id,
    view: (surface) => surface.opportunitySwuView,
    winningProposalScore: async (surface) => {
      const proposal = surface.proposalSwuView;
      try {
        await proposal.open({ opportunityId: seed.opportunities.swuAwarded.id, proposalId: seed.proposals.swuAwardedWinner.id });
      } catch {
        return "";
      }
      return readOrEmpty(() => proposal.totalScore());
    },
  },
];

// Opens the awarded opportunity and waits until it names its successful proponent, which is
// what shows the award has been made.
async function openNamingWinner(view: View, opportunityId: string): Promise<void> {
  await view.open({ opportunityId });
  await expect.poll(() => readOrEmpty(() => view.successfulProponent()), settle).toContain(winner);
}

for (const program of programs) {
  test(`${statement} (${program.name}: a visitor who may not see proposal scores)`, async ({ surface }) => {
    const view = program.view(surface);
    await openNamingWinner(view, program.opportunityId);

    expect(await readOrEmpty(() => view.successfulProponentContactDetails())).toBeFalsy();
    expect(await readOrEmpty(() => view.successfulProponentScore())).toBeFalsy();

    expect(await program.winningProposalScore(surface)).toBeFalsy();
  });

  test(`${statement} (${program.name}: a reader permitted to see proposal scores)`, async ({ surface }) => {
    await surface.signIn(persona.administrator);
    const view = program.view(surface);
    await openNamingWinner(view, program.opportunityId);

    const contactDetails = await readOrEmpty(() => view.successfulProponentContactDetails());
    const scoreOnOpportunity = await readOrEmpty(() => view.successfulProponentScore());
    const scoreOnProposal = await program.winningProposalScore(surface);

    expect(contactDetails).toBeTruthy();
    expect(scoreOnOpportunity || scoreOnProposal).toBeTruthy();
  });
}
