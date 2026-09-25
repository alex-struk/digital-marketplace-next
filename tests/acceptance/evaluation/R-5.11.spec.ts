// criterion: @R-5.11 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";

// The record is seed.opportunities.swuCodeChallengeOfOtherStaff: past the question stages, at
// the code challenge, owned by users.staffTwo, with users.administratorOne and users.staffTwo
// on its panel and every individual evaluation submitted by both. users.staffOne, whom
// persona.publicSectorStaff signs in as, has no connection to it at all.
//
// The evaluation read is users.staffTwo's own evaluation of the first seeded proponent, opened
// on evaluation-individual-edit-swu. A refusal is read through refused_when_not_permitted, which
// tells a reader who may not see the evaluation from an evaluation with nothing in it. The
// administrator, who may read it, is the contrast: refused_when_not_permitted stays empty and
// the evaluation's status is shown.

const params = {
  opportunityId: seed.opportunities.swuCodeChallengeOfOtherStaff.id,
  proposalId: seed.proposals.swuOtherStaffOne.id,
  userId: seed.users.staffTwo.id,
};
const settle = { timeout: 15000 };

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

test("An individual evaluation may be read only by an administrator, the opportunity's owner, and the members of that opportunity's evaluation panel, at every stage (an administrator reads it past the question stages)", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.evaluationIndividualEditSwu.open(params);
  await expect.poll(() => readOrEmpty(() => surface.evaluationIndividualEditSwu.evaluationStatus()), settle).toBeTruthy();
  expect(await readOrEmpty(() => surface.evaluationIndividualEditSwu.refusedWhenNotPermitted())).toBeFalsy();
});

test("An individual evaluation may be read only by an administrator, the opportunity's owner, and the members of that opportunity's evaluation panel, at every stage; passing the question stages does not open it to public sector employees with no connection to the opportunity", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.evaluationIndividualEditSwu.open(params);
  await expect
    .poll(() => readOrEmpty(() => surface.evaluationIndividualEditSwu.refusedWhenNotPermitted()), settle)
    .toBeTruthy();
});
