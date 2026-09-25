// criterion: @R-2.32 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is the seeded Sprint With Us opportunity in processing kept for this criterion:
// its first two proposals fully evaluated and neither awarded, the third left behind at the
// questions. The first belongs to the organization the organization owner persona owns, so it
// is that vendor's own proposal.
//
// That the proposal has been scored is established first, by the administrator reading its
// total off the evaluation view, so that the vendor then seeing no score is the withholding
// and not the score being absent. The vendor then opens their own proposal and sees neither
// a score nor a rank.
//
// The two ways the withholding ends are one test each, each starting from the same seed:
//
//   - the administrator awards the vendor's proposal;
//   - the administrator awards the other fully evaluated proposal, which passes the vendor's
//     over.
//
// In both, the vendor's own proposal then shows its score and its rank.

const statement =
  "A vendor sees the scores and rank of their own proposal only after the opportunity has been awarded or their proposal has been passed over.";

const settle = { timeout: 30000 };
const opportunityId = seed.opportunities.swuProcessingA.id;
const own = seed.proposals.swuProcessingAFirst.id;
const other = seed.proposals.swuProcessingASecond.id;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function whatTheVendorSees(surface: Surface): Promise<{ score: string; rank: string }> {
  await surface.proposalSwuEdit.open({ opportunityId, proposalId: own });
  return {
    score: await readOrEmpty(() => surface.proposalSwuEdit.totalScore()),
    rank: await readOrEmpty(() => surface.proposalSwuEdit.rank()),
  };
}

async function scoredButWithheld(surface: Surface): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.proposalSwuView.open({ opportunityId, proposalId: own });
  expect(await readOrEmpty(() => surface.proposalSwuView.totalScore()), "the proposal carries no score").toMatch(/\d/);
  await surface.signOut();

  await surface.signIn(persona.organizationOwner);
  const seen = await whatTheVendorSees(surface);
  expect(seen.score, "the vendor was shown a score before the award").not.toMatch(/\d/);
  expect(seen.rank, "the vendor was shown a rank before the award").not.toMatch(/\d/);
  await surface.signOut();
}

async function award(surface: Surface, proposalId: string): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.proposalSwuView.open({ opportunityId, proposalId });
  await surface.proposalSwuView.awardProposal();
  await expect
    .poll(async () => {
      await surface.opportunitySwuView.open({ opportunityId });
      return (await readOrEmpty(() => surface.opportunitySwuView.status())).toLowerCase();
    }, settle)
    .toMatch(/awarded/);
  await surface.signOut();
}

async function shownToTheVendor(surface: Surface): Promise<void> {
  await surface.signIn(persona.organizationOwner);
  await expect.poll(async () => (await whatTheVendorSees(surface)).score, settle).toMatch(/\d/);
  expect((await whatTheVendorSees(surface)).rank).toMatch(/\d/);
}

test(`${statement} (their proposal awarded)`, async ({ surface }) => {
  await scoredButWithheld(surface);
  await award(surface, own);
  await shownToTheVendor(surface);
});

test(`${statement} (their proposal passed over)`, async ({ surface }) => {
  await scoredButWithheld(surface);
  await award(surface, other);
  await shownToTheVendor(surface);
});
