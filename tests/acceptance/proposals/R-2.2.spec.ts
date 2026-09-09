// criterion: @R-2.2 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The first proposal is left as a draft, because the criterion says the vendor's existing
// proposal blocks a second one whatever state it is in, and a draft is the weakest of
// those states — if even a draft blocks the second attempt, every other state does.
//
// The refusal is read from the create screen's field error, which is where a create the
// service turns away reports itself. That no second proposal was made is read from the one
// proposal the vendor holds against that opportunity still carrying the first proposal's
// text: a vendor's proposal is addressed by the opportunity it answers, so a second one
// would have left the surface with two records to choose between.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const details = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  reward: 5000,
  skills: ["Backend Development"],
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(35),
};

async function publishOpportunity(surface: Surface, title: string): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...details, title });
  await surface.signOut();
}

test("a vendor may hold at most one proposal per opportunity, and a second attempt is refused with a message saying they already have one", async ({
  surface,
}) => {
  const title = "R-2.2 opportunity a vendor tries to bid on twice";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunity: title });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.saveDraft({
    proposalText: "The first proposal this vendor offered against the opportunity.",
  });

  await surface.proposalCwuCreate.open({ opportunity: title });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.saveDraft({
    proposalText: "A second proposal against the same opportunity.",
  });

  expect((await surface.proposalCwuCreate.fieldError()).toLowerCase()).toContain(
    "already have a proposal",
  );

  await surface.proposalCwuEdit.open({ opportunity: title });
  expect(await surface.proposalCwuEdit.proposalTab()).toContain(
    "The first proposal this vendor offered against the opportunity.",
  );
});
