// criterion: @R-1.24 v1
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is a published opportunity with submitted proposals whose deadline has gone by,
// which the seed carries for both programs that anonymise their proponents, three proposals
// each. The when is the closure, set off through the scheduled transition trigger.
//
// Closure is not read as finished the instant it is set off: the opportunity is first waited
// for until it stands at an evaluation stage, and the names are then waited for on the
// evaluation list, which is where the criterion says they are used. The administrator sits on
// both seeded panels as chair and evaluator, so the list answers for them. Which proposal
// carries which number is the service's to choose, so the three names are looked for as a set.

const settle = { timeout: 30000 };
const names = ["Proponent 1", "Proponent 2", "Proponent 3"];

async function close(surface: Surface): Promise<void> {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
}

test("on closing a Sprint With Us opportunity, each submitted proposal is given an anonymous proponent name for use during evaluation", async ({
  surface,
}) => {
  const opportunityId = seed.opportunities.closedSprintWithUs.id;
  await close(surface);
  await surface.signIn(persona.administrator);

  await expect
    .poll(async () => {
      await surface.opportunitySwuView.open({ opportunityId });
      return (await surface.opportunitySwuView.status()).toLowerCase();
    }, settle)
    .toMatch(/evaluat|question/);

  const read = async (): Promise<string> => {
    await surface.evaluationIndividualListSwu.open({ opportunityId });
    return surface.evaluationIndividualListSwu.anonymousProponentName();
  };
  await expect.poll(async () => { const shown = await read(); return names.filter((name) => shown.includes(name)).length; }, settle).toBe(3);
});

test("on closing a Team With Us opportunity, each submitted proposal is given an anonymous proponent name for use during evaluation", async ({
  surface,
}) => {
  const opportunityId = seed.opportunities.closedTeamWithUs.id;
  await close(surface);
  await surface.signIn(persona.administrator);

  await expect
    .poll(async () => {
      await surface.opportunityTwuView.open({ opportunityId });
      return (await surface.opportunityTwuView.status()).toLowerCase();
    }, settle)
    .toMatch(/evaluat|question/);

  const read = async (): Promise<string> => {
    await surface.evaluationIndividualListTwu.open({ opportunityId });
    return surface.evaluationIndividualListTwu.anonymousProponentName();
  };
  await expect.poll(async () => { const shown = await read(); return names.filter((name) => shown.includes(name)).length; }, settle).toBe(3);
});
