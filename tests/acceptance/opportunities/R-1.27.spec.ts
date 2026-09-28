// criterion: @R-1.27 v1
// provenance: blind, spec@c1e09955fdff55e84870c25dfcb8e0fd9981c437, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The seed carries an opportunity already awarded to Northern Pines in Code With Us and in
// Sprint With Us; the winning proposal of each was made by the organization's owner, whose
// address is the contact address a reader would be shown. Each is looked at twice:
//
//   - by a visitor who is not signed in, who may not see any proposal's score: the successful
//     proponent's name is shown, and neither their contact details nor their score is shown
//     anywhere the visitor can reach — the opportunity itself, its award summary or the
//     winning proposal;
//   - by an administrator, who may see every proposal's score: the name is shown, and the
//     contact details and the score are each shown somewhere the administrator is shown the
//     award — the opportunity, its award summary or the winning proposal. The criterion does
//     not say where, so any one of them will do.
//
// That the opportunity is awarded is established by the successful proponent being named,
// not by the word its status is shown with.

const settle = { timeout: 15000 };
const winner = seed.organizations.qualified.legal_name;
const contactAddress = seed.users.organizationOwner.email;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function openOrFalse(open: () => Promise<void>): Promise<boolean> {
  try {
    await open();
    return true;
  } catch {
    return false;
  }
}

type View = Surface["opportunityCwuView"] | Surface["opportunitySwuView"];

// Everything a reader is shown of the award away from the opportunity's own page: the award
// summary on the opportunity's management screen, and the winning proposal. Each part is
// empty where the reader cannot reach it.
interface Elsewhere {
  summary: string;
  proposal: string;
  proposalScore: string;
}

interface Program {
  name: string;
  opportunityId: string;
  view: (surface: Surface) => View;
  seededScore?: number;
  elsewhere: (surface: Surface) => Promise<Elsewhere>;
}

const programs: Program[] = [
  {
    name: "Code With Us",
    opportunityId: seed.opportunities.cwuAwarded.id,
    view: (surface) => surface.opportunityCwuView,
    seededScore: seed.proposals.cwuAwardedWinner.score,
    elsewhere: async (surface) => {
      const opportunityId = seed.opportunities.cwuAwarded.id;
      const edit = surface.opportunityCwuEdit;
      const summary = (await openOrFalse(() => edit.open({ opportunityId })))
        ? await readOrEmpty(() => edit.summaryTab())
        : "";
      const proposalPage = surface.proposalCwuView;
      const opened = await openOrFalse(() =>
        proposalPage.open({ opportunityId, proposalId: seed.proposals.cwuAwardedWinner.id }),
      );
      const proposal = opened
        ? [await readOrEmpty(() => proposalPage.proponent()), await readOrEmpty(() => proposalPage.proposalTab())].join("\n")
        : "";
      const proposalScore = opened ? await readOrEmpty(() => proposalPage.score()) : "";
      return { summary, proposal, proposalScore };
    },
  },
  {
    name: "Sprint With Us",
    opportunityId: seed.opportunities.swuAwarded.id,
    view: (surface) => surface.opportunitySwuView,
    elsewhere: async (surface) => {
      const opportunityId = seed.opportunities.swuAwarded.id;
      const edit = surface.opportunitySwuEdit;
      const summary = (await openOrFalse(() => edit.open({ opportunityId })))
        ? await readOrEmpty(() => edit.summaryTab())
        : "";
      const proposalPage = surface.proposalSwuView;
      const opened = await openOrFalse(() =>
        proposalPage.open({ opportunityId, proposalId: seed.proposals.swuAwardedWinner.id }),
      );
      const proposal = opened ? await readOrEmpty(() => proposalPage.proposalTab()) : "";
      const proposalScore = opened ? await readOrEmpty(() => proposalPage.totalScore()) : "";
      return { summary, proposal, proposalScore };
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
  test(`An awarded opportunity shows its successful proponent's name to everyone, and shows the proponent's contact details and score only to those permitted to see the proposal's score. (${program.name}: a visitor who may not see proposal scores)`, async ({
    surface,
  }) => {
    const view = program.view(surface);
    await openNamingWinner(view, program.opportunityId);

    expect(await readOrEmpty(() => view.successfulProponentContactDetails())).toBeFalsy();
    expect(await readOrEmpty(() => view.successfulProponentScore())).toBeFalsy();

    const elsewhere = await program.elsewhere(surface);
    expect(elsewhere.summary).not.toContain(contactAddress);
    expect(elsewhere.proposal).not.toContain(contactAddress);
    expect(elsewhere.proposalScore).toBeFalsy();
    if (program.seededScore !== undefined) {
      expect(elsewhere.summary).not.toContain(String(program.seededScore));
    }
  });

  test(`An awarded opportunity shows its successful proponent's name to everyone, and shows the proponent's contact details and score only to those permitted to see the proposal's score. (${program.name}: a reader permitted to see proposal scores)`, async ({
    surface,
  }) => {
    await surface.signIn(persona.administrator);
    const view = program.view(surface);
    await openNamingWinner(view, program.opportunityId);

    const contactOnOpportunity = await readOrEmpty(() => view.successfulProponentContactDetails());
    const scoreOnOpportunity = await readOrEmpty(() => view.successfulProponentScore());
    const elsewhere = await program.elsewhere(surface);

    const contactShown =
      Boolean(contactOnOpportunity) ||
      elsewhere.summary.includes(contactAddress) ||
      elsewhere.proposal.includes(contactAddress);
    const scoreShown =
      Boolean(scoreOnOpportunity) ||
      Boolean(elsewhere.proposalScore) ||
      (program.seededScore !== undefined && elsewhere.summary.includes(String(program.seededScore)));

    expect(contactShown, "the successful proponent's contact details are shown somewhere this reader sees the award").toBe(true);
    expect(scoreShown, "the successful proponent's score is shown somewhere this reader sees the award").toBe(true);
  });
}
